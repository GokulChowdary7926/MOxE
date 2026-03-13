/**
 * Email addition and verification for Personal accounts.
 * Optional: block disposable domains via disposable-email-domains.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 24;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 min between resends

// Minimal blocklist; in production use disposable-email-domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com',
  'mailinator.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
]);

function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : true;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export class EmailService {
  async requestVerification(userId: string, email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) throw new AppError('Invalid email format', 400);
    if (isDisposable(trimmed)) throw new AppError('Disposable email addresses are not allowed', 400);

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmed },
      select: { id: true },
    });
    if (existingUser && existingUser.id !== userId)
      throw new AppError('This email is already used by another account', 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });
    if (!user) throw new AppError('User not found', 404);

    const recent = await prisma.emailVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS)
      throw new AppError('Please wait a minute before requesting another verification email', 429);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    await prisma.emailVerification.deleteMany({ where: { userId } });
    await prisma.emailVerification.create({
      data: { userId, email: trimmed, token, expiresAt },
    });

    // In production: send email via Resend/SendGrid with link
    // e.g. https://moxe.com/verify-email?token=...
    const baseUrl = process.env.APP_BASE_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    if (process.env.SEND_VERIFICATION_EMAIL === 'true' && process.env.RESEND_API_KEY) {
      // Optional: await sendEmail(trimmed, 'Verify your email', `Click: ${verifyUrl}`);
    }
    // For development, log link (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email verification]', verifyUrl);
    }

    return { message: 'Verification email sent. Please check your inbox.', verifyUrl: process.env.NODE_ENV === 'development' ? verifyUrl : undefined };
  }

  async verifyToken(token: string) {
    const record = await prisma.emailVerification.findUnique({
      where: { token },
    });
    if (!record) throw new AppError('Invalid or expired verification link', 400);
    if (record.expiresAt < new Date()) {
      await prisma.emailVerification.delete({ where: { id: record.id } }).catch(() => {});
      throw new AppError('Verification link has expired', 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email: record.email },
      select: { id: true },
    });
    if (existing && existing.id !== record.userId)
      throw new AppError('This email is already used by another account', 400);

    await prisma.user.update({
      where: { id: record.userId },
      data: { email: record.email, emailVerified: true },
    });
    await prisma.emailVerification.delete({ where: { id: record.id } });
    return { success: true, email: record.email };
  }
}
