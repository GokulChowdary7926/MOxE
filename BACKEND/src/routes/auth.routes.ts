import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationCode, verifyCode } from '../services/phoneVerification.service';
import { EmailService } from '../services/email.service';
import { AppError } from '../utils/AppError';
import { prisma } from '../server';

const emailService = new EmailService();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

const router = Router();

router.get('/', (_req, res) => res.json({ service: 'auth' }));

const backendBase = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5007';
const defaultGoogleRedirect = `${backendBase}/api/auth/google/callback`;

/** GET /auth/google/url – returns Google OAuth URL for "Log in with Google". */
router.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || defaultGoogleRedirect;
  if (!clientId) {
    return res.status(503).json({
      error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.',
    });
  }
  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  res.json({ url });
});

/** GET /auth/google/callback – Google redirects here with ?code=...; exchange for tokens and redirect to app with JWT. */
router.get('/google/callback', async (req, res, next) => {
  const code = req.query.code as string;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || defaultGoogleRedirect;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  if (!code || !clientId || !clientSecret) {
    const err = !code ? 'Missing code' : 'Google sign-in not configured (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required)';
    return res.redirect(302, `${clientUrl}/login?error=${encodeURIComponent(err)}`);
  }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData: any = await tokenRes.json().catch(() => ({} as any));
    if (!tokenRes.ok) {
      const msg = tokenData.error_description || tokenData.error || 'Token exchange failed';
      return res.redirect(302, `${clientUrl}/login?error=${encodeURIComponent(msg)}`);
    }
    const accessToken = tokenData.access_token;
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo: any = await userRes.json().catch(() => ({} as any));
    if (!userRes.ok) {
      return res.redirect(302, `${clientUrl}/login?error=${encodeURIComponent('Failed to get user info')}`);
    }
    const email = userInfo.email as string | undefined;
    const googleId = userInfo.id as string | undefined;
    if (!email && !googleId) {
      return res.redirect(302, `${clientUrl}/login?error=${encodeURIComponent('No email or id from Google')}`);
    }

    const existing = await prisma.user.findFirst({
      where: { email: email || undefined },
      select: { id: true, accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' }, select: { id: true } } },
    });

    let userId: string;
    let accountId: string;

    if (existing && existing.accounts.length) {
      userId = existing.id;
      accountId = (existing.accounts[0] as { id: string }).id;
    } else {
      const placeholderPhone = `+0google_${(googleId || email || '').replace(/\W/g, '_').slice(0, 20)}_${Date.now().toString(36)}`;
      const usernameBase = (email?.split('@')[0] || `user_${(googleId || '').slice(0, 8)}`).replace(/\W/g, '_');
      let uniqueUsername = usernameBase;
      let n = 0;
      while (await prisma.account.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${usernameBase}_${++n}`;
      }
      const newUser = await prisma.user.create({
        data: {
          phoneNumber: placeholderPhone,
          email: email || undefined,
          password: await bcrypt.hash(Math.random().toString(36) + Date.now(), 10),
          dateOfBirth: new Date('2000-01-01'),
          accounts: {
            create: {
              username: uniqueUsername,
              displayName: userInfo.name || email?.split('@')[0] || 'User',
              accountType: 'PERSONAL',
              isActive: true,
            },
          },
        },
        select: { id: true, accounts: { take: 1, select: { id: true } } },
      });
      userId = newUser.id;
      accountId = (newUser.accounts[0] as { id: string }).id;
    }

    const token = jwt.sign({ userId, accountId }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(302, `${clientUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (e) {
    next(e);
  }
});

const sendCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
  keyGenerator: (req: any): string => req.ip || 'unknown',
  skipSuccessfulRequests: true,
});

router.post('/send-verification-code', sendCodeLimiter, async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new AppError('phoneNumber required', 400);
    }
    const result = await sendVerificationCode(phoneNumber.trim());
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/verify-code', async (req, res, next) => {
  try {
    const { phoneNumber, code, password, username, displayName, dateOfBirth } = req.body;
    if (!phoneNumber || !code) {
      throw new AppError('phoneNumber and code required', 400);
    }
    if (password == null || password === '') {
      throw new AppError('Password required', 400);
    }
    const registration =
      username != null && displayName != null && dateOfBirth != null &&
      String(username).trim() && String(displayName).trim() && String(dateOfBirth).trim()
        ? { password: String(password), username: String(username).trim(), displayName: String(displayName).trim(), dateOfBirth: String(dateOfBirth) }
        : { password: String(password) };
    const result = await verifyCode(phoneNumber.trim(), String(code).trim(), registration);
    res.json({
      token: result.token,
      userId: result.userId,
      accountId: result.accountId,
      isNewUser: result.isNewUser,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.redirect(302, (process.env.CLIENT_URL || 'http://localhost:3000') + '/verify-email?error=missing');
    }
    const result = await emailService.verifyToken(token);
    const base = process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(302, `${base}/verify-email?success=1&email=${encodeURIComponent(result.email)}`);
  } catch (e) {
    const base = process.env.CLIENT_URL || 'http://localhost:3000';
    const msg = e instanceof Error ? e.message : 'Invalid or expired link';
    return res.redirect(302, `${base}/verify-email?error=${encodeURIComponent(msg)}`);
  }
});

// Request a verification email for a logged-in user.
router.post('/email/request-verification', async (req, res, next) => {
  try {
    const { userId, email } = req.body as { userId?: string; email?: string };
    if (!userId || typeof userId !== 'string' || !email || typeof email !== 'string') {
      throw new AppError('userId and email are required', 400);
    }
    const result = await emailService.requestVerification(userId, email);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/register', (_req, res) => res.status(501).json({ error: 'Use send-verification-code and verify-code to register' }));

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || typeof loginId !== 'string' || !password || typeof password !== 'string') {
      throw new AppError('loginId and password required', 400);
    }
    const id = (loginId as string).trim();
    if (!id || !password) throw new AppError('Invalid credentials', 400);

    type UserWithAccount = { id: string; password: string; accounts: { id: string }[] };
    let user: UserWithAccount | null = null;

    if (id.includes('@')) {
      const row = await prisma.user.findUnique({
        where: { email: id },
        select: { id: true, password: true, accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' }, select: { id: true } } },
      });
      user = row as UserWithAccount | null;
    } else if (/^[\d+\s\-()]+$/.test(id.replace(/\s/g, ''))) {
      const phone = normalizePhone(id);
      const row = await prisma.user.findUnique({
        where: { phoneNumber: phone },
        select: { id: true, password: true, accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' }, select: { id: true } } },
      });
      user = row as UserWithAccount | null;
    } else {
      const account = await prisma.account.findUnique({
        where: { username: id, isActive: true },
        select: { id: true, userId: true },
      });
      if (account) {
        const row = await prisma.user.findUnique({
          where: { id: account.userId },
          select: { id: true, password: true, accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' }, select: { id: true } } },
        });
        user = row as UserWithAccount | null;
      }
    }

    if (!user) throw new AppError('Invalid login ID or password', 401);
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AppError('Invalid login ID or password', 401);

    let accountId: string | null = user.accounts[0]?.id ?? null;
    if (!accountId) {
      const firstAccount = await prisma.account.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      accountId = firstAccount?.id ?? null;
    }
    if (!accountId) throw new AppError('No account found for this user. Please contact support.', 401);

    const finalAccountId = accountId as string;

    const token = jwt.sign({ userId: user.id, accountId: finalAccountId }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
        isActive: true,
      },
    });

    res.json({
      token,
      refreshToken,
      userId: user.id,
      accountId: finalAccountId,
      user: { id: user.id },
    });
  } catch (e) {
    next(e);
  }
});

// Refresh access token using opaque Session-based refresh token.
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new AppError('refreshToken required', 400);
    }

    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, accounts: { where: { isActive: true }, take: 1, select: { id: true } } } } },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = session.user;
    if (!user) throw new AppError('User not found for session', 401);
    const accountId =
      user.accounts[0]?.id ??
      (await prisma.account.findFirst({ where: { userId: user.id }, select: { id: true } }))?.id;
    if (!accountId) throw new AppError('No account found for this user', 401);

    const newAccessToken = jwt.sign({ userId: user.id, accountId }, JWT_SECRET, {
      expiresIn: '7d',
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    res.json({
      token: newAccessToken,
      userId: user.id,
      accountId,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
