import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';
import { AccessService } from '../services/access.service';
import { sendVerificationCode, verifyCode } from '../services/phoneVerification.service';
import { EmailService } from '../services/email.service';
import { AppError } from '../utils/AppError';
import { prisma } from '../server';
import { logger } from '../utils/logger';
import {
  normalizeUsername,
  validateUsernameFormat,
  suggestUsernameFromEmailLocalPart,
  randomAlphabeticLower,
} from '../utils/usernameValidation';

const emailService = new EmailService();
const accessService = new AccessService();
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
      const localPart = email?.split('@')[0] || `user${(googleId || '').replace(/[^a-z]/gi, '').slice(0, 12)}`;
      let base = suggestUsernameFromEmailLocalPart(localPart);
      let uniqueUsername = base;
      let attempts = 0;
      while (await prisma.account.findUnique({ where: { username: uniqueUsername } })) {
        attempts += 1;
        const suffix = randomAlphabeticLower(Math.min(4 + attempts, 10));
        uniqueUsername = `${base.slice(0, Math.max(3, 30 - suffix.length))}${suffix}`.slice(0, 30);
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
    try {
      await accessService.appendSessionLoginAudits(accountId);
    } catch (err) {
      logger.warn('Google login: org audit log skipped', {
        err: err instanceof Error ? err.message : String(err),
      });
    }
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
    const { phoneNumber, code, password, username, displayName, dateOfBirth, accountType } = req.body;
    if (!phoneNumber || !code) {
      throw new AppError('phoneNumber and code required', 400);
    }
    if (password == null || password === '') {
      throw new AppError('Password required', 400);
    }
    const registration =
      username != null && displayName != null && dateOfBirth != null &&
      String(username).trim() && String(displayName).trim() && String(dateOfBirth).trim()
        ? { password: String(password), username: String(username).trim(), displayName: String(displayName).trim(), dateOfBirth: String(dateOfBirth), accountType: accountType != null ? String(accountType) : undefined }
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

/** POST /auth/register — Username-only signup (no phone). Body: { username, displayName, password, accountType? } */
router.post('/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), async (req, res, next) => {
  try {
    const { username, displayName, password, accountType } = req.body;
    if (!username || typeof username !== 'string' || !displayName || typeof displayName !== 'string' || !password || typeof password !== 'string') {
      throw new AppError('username, displayName and password are required', 400);
    }
    const uCheck = validateUsernameFormat(username);
    if (!uCheck.valid) throw new AppError(uCheck.message, 400);
    const u = uCheck.normalized;
    const d = displayName.trim();
    if (!d || d.length < 2) throw new AppError('Display name must be at least 2 characters', 400);
    if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
    const existing = await prisma.account.findUnique({ where: { username: u } });
    if (existing) throw new AppError('Username is already taken', 400);
    const allowedTypes = ['PERSONAL', 'BUSINESS', 'CREATOR', 'JOB'];
    const type = accountType && allowedTypes.includes(String(accountType).toUpperCase()) ? String(accountType).toUpperCase() : 'PERSONAL';
    const placeholderPhone = `+0user_${u.slice(0, 20).replace(/\W/g, '_')}_${Date.now().toString(36)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        phoneNumber: placeholderPhone,
        password: hashedPassword,
        dateOfBirth: new Date('2000-01-01'),
        accounts: {
          create: {
            username: u,
            displayName: d,
            accountType: type as 'PERSONAL' | 'BUSINESS' | 'CREATOR' | 'JOB',
            isActive: true,
          },
        },
      },
      select: { id: true, accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' }, select: { id: true } } },
    });
    const accountId = (newUser.accounts[0] as { id: string }).id;
    const token = jwt.sign({ userId: newUser.id, accountId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      userId: newUser.id,
      accountId,
      user: { id: newUser.id },
    });
  } catch (e) {
    next(e);
  }
});

/** POST /auth/login — Username + password only (no phone/email). */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || typeof loginId !== 'string' || !password || typeof password !== 'string') {
      throw new AppError('Username and password required', 400);
    }
    const username = normalizeUsername(loginId as string);
    if (!username || !password) throw new AppError('Invalid credentials', 400);

    type UserWithAccount = { id: string; password: string; accounts: { id: string }[] };
    // `findUnique` only allows unique fields; `isActive` requires `findFirst`.
    const account = await prisma.account.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true, userId: true, isMemorialized: true },
    });
    if (!account) throw new AppError('Invalid username or password', 401);
    if (account.isMemorialized) {
      throw new AppError('This account has been memorialized and cannot be logged into.', 403);
    }
    const row = await prisma.user.findUnique({
      where: { id: account.userId },
      select: { id: true, password: true, accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' }, select: { id: true } } },
    });
    const user = row as UserWithAccount | null;
    if (!user) throw new AppError('Invalid username or password', 401);
    const storedHash = user.password?.trim() ?? '';
    if (!storedHash) throw new AppError('Invalid username or password', 401);
    let match = false;
    try {
      match = await bcrypt.compare(password, storedHash);
    } catch {
      // Corrupt or non-bcrypt hash in DB would throw; never surface as 500.
      match = false;
    }
    if (!match) throw new AppError('Invalid username or password', 401);

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

    let refreshToken: string | undefined;
    try {
      refreshToken = crypto.randomBytes(40).toString('hex');
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
    } catch (e) {
      logger.warn('Login: could not create refresh Session row (migrations or DB issue). JWT login still works.', {
        err: e instanceof Error ? e.message : String(e),
      });
      refreshToken = undefined;
    }

    try {
      await accessService.appendSessionLoginAudits(finalAccountId);
    } catch (e) {
      logger.warn('Login: org audit log skipped', {
        err: e instanceof Error ? e.message : String(e),
      });
    }

    res.json({
      token,
      ...(refreshToken ? { refreshToken } : {}),
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

/** POST /auth/switch-account — switch active account context and mint new access token. */
router.post('/switch-account', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    const targetAccountId = typeof req.body?.accountId === 'string' ? req.body.accountId.trim() : '';
    if (!userId) throw new AppError('Unauthorized', 401);
    if (!targetAccountId) throw new AppError('accountId required', 400);

    const account = await prisma.account.findFirst({
      where: {
        id: targetAccountId,
        userId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!account) throw new AppError('Account not found', 404);

    const token = jwt.sign({ userId, accountId: account.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      userId,
      accountId: account.id,
    });
  } catch (e) {
    next(e);
  }
});

/** List active refresh-token sessions for the signed-in user (devices / “where you’re logged in”). */
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const sessions = await prisma.session.findMany({
      where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        location: true,
        ipAddress: true,
        lastActive: true,
        createdAt: true,
      },
    });
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
});

/** Revoke a session (sign out that device). */
router.delete('/sessions/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const session = await prisma.session.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** POST /auth/password/reset-request — request password reset by email or phone. Returns 501 until implemented. */
router.post('/password/reset-request', async (req, res) => {
  const { emailOrPhone } = req.body as { emailOrPhone?: string };
  if (!emailOrPhone || typeof emailOrPhone !== 'string' || !emailOrPhone.trim()) {
    return res.status(400).json({ error: 'emailOrPhone is required' });
  }
  return res.status(501).json({
    error: 'Password reset is not available yet. Use your existing password or sign up if you don\'t have an account.',
  });
});

export default router;
