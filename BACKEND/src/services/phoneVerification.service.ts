/**
 * Phone verification: send 6-digit code via Twilio, verify code and login/register.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { sendSms, isTwilioConfigured } from './twilio.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const CODE_EXPIRY_MINUTES = 10;
const MAX_SENDS_PER_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phoneNumber: string): Promise<{ ok: boolean; message?: string }> {
  const phone = normalizePhone(phoneNumber);
  if (!phone || phone.length < 10) throw new AppError('Invalid phone number', 400);

  if (!isTwilioConfigured()) {
    throw new AppError('SMS verification is not configured', 503);
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.phoneVerification.count({
    where: { phoneNumber: phone, createdAt: { gte: oneHourAgo } },
  });
  if (recentCount >= MAX_SENDS_PER_HOUR) {
    throw new AppError('Too many attempts. Try again in an hour.', 429);
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.phoneVerification.create({
    data: { phoneNumber: phone, code, expiresAt },
  });

  const result = await sendSms(phone, `Your MOxE verification code is: ${code}. It expires in ${CODE_EXPIRY_MINUTES} minutes.`);
  if (!result.ok) {
    throw new AppError(result.error || 'Failed to send SMS', 500);
  }

  return { ok: true, message: 'Code sent' };
}

export interface VerifyCodeRegistration {
  password: string;
  username?: string;
  displayName?: string;
  dateOfBirth?: string; // ISO date
}

export async function verifyCode(
  phoneNumber: string,
  code: string,
  registration?: VerifyCodeRegistration
): Promise<{ token: string; userId: string; accountId?: string; isNewUser?: boolean }> {
  const phone = normalizePhone(phoneNumber);
  if (!phone || !code || code.length !== 6) throw new AppError('Invalid phone or code', 400);

  const latest = await prisma.phoneVerification.findFirst({
    where: { phoneNumber: phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) {
    throw new AppError('Invalid or expired code. Request a new one.', 401);
  }

  if (latest.code !== code) {
    await prisma.phoneVerification.update({
      where: { id: latest.id },
      data: { attempts: latest.attempts + 1 },
    });
    if (latest.attempts + 1 >= MAX_VERIFY_ATTEMPTS) {
      await prisma.phoneVerification.deleteMany({ where: { phoneNumber: phone } });
      throw new AppError('Too many wrong attempts. Request a new code.', 429);
    }
    throw new AppError('Invalid code', 401);
  }

  await prisma.phoneVerification.deleteMany({ where: { phoneNumber: phone } });

  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: phone },
    include: { accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' } } },
  });

  if (existingUser) {
    if (!registration?.password) {
      throw new AppError('Password required to log in', 400);
    }
    const match = await bcrypt.compare(registration.password, existingUser.password);
    if (!match) throw new AppError('Invalid password', 401);

    const accountId = existingUser.accounts[0]?.id ?? existingUser.id;
    const token = jwt.sign(
      { userId: existingUser.id, accountId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return { token, userId: existingUser.id, accountId, isNewUser: false };
  }

  if (!registration?.password || !registration?.username?.trim() || !registration?.displayName?.trim() || !registration?.dateOfBirth) {
    throw new AppError('Registration data required: password, username, displayName, dateOfBirth', 400);
  }

  const dateOfBirth = new Date(registration.dateOfBirth);
  if (isNaN(dateOfBirth.getTime())) throw new AppError('Invalid date of birth', 400);
  const age = (Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 13) throw new AppError('You must be at least 13 to register', 400);

  const existingUsername = await prisma.account.findUnique({ where: { username: registration.username.trim() } });
  if (existingUsername) throw new AppError('Username already taken', 400);

  const hashedPassword = await bcrypt.hash(registration.password, 10);

  const user = await prisma.user.create({
    data: {
      phoneNumber: phone,
      password: hashedPassword,
      dateOfBirth,
    },
  });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      username: registration.username.trim(),
      displayName: registration.displayName.trim(),
      accountType: 'PERSONAL',
      subscriptionTier: 'FREE',
      isPrivate: age < 18,
    },
  });

  // Block new accounts: anyone who had blockFutureAccounts on a user with this phone now blocks this new account
  const blocksToApply = await prisma.block.findMany({
    where: { blockFutureAccounts: true, blocked: { user: { phoneNumber: phone } } },
    select: { blockerId: true },
  });
  for (const b of blocksToApply) {
    await prisma.block.create({
      data: { blockerId: b.blockerId, blockedId: account.id, blockFutureAccounts: false },
    }).catch(() => {});
  }

  const token = jwt.sign(
    { userId: user.id, accountId: account.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, userId: user.id, accountId: account.id, isNewUser: true };
}
