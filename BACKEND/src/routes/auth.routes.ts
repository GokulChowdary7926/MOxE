import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

const sendCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Try again later.' },
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

router.post('/register', (_req, res) => res.status(501).json({ error: 'Use send-verification-code and verify-code to register' }));

router.post('/login', async (req, res, next) => {
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

    const accountId = user.accounts[0]?.id ?? user.id;
    const token = jwt.sign({ userId: user.id, accountId }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      userId: user.id,
      accountId,
      user: { id: user.id },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
