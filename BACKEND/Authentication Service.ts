// backend/src/services/auth.service.ts

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '../server';
import { redisClient } from '../server';
import { sendSMS, sendEmail } from '../utils/notifications';
import { AppError } from '../utils/AppError';
import { UserCreateInput, LoginInput, VerifyPhoneInput } from '../types/auth.types';

export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'secret';
  private readonly JWT_EXPIRY = '7d';

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification code via SMS
   */
  async sendPhoneVerification(phoneNumber: string): Promise<void> {
    // Check rate limiting
    const key = `sms:${phoneNumber}`;
    const attempts = await redisClient.get(key);
    
    if (attempts && parseInt(attempts) >= 3) {
      throw new AppError('Too many verification attempts. Please try again later.', 429);
    }

    // Generate OTP
    const otp = this.generateOTP();
    
    // Store OTP in Redis
    await redisClient.setex(`otp:${phoneNumber}`, this.OTP_EXPIRY, otp);
    
    // Increment attempt counter
    await redisClient.incr(key);
    await redisClient.expire(key, 3600); // 1 hour

    // Send SMS (mock for development)
    console.log(`Sending OTP ${otp} to ${phoneNumber}`);
    await sendSMS(phoneNumber, `Your MOxE verification code is: ${otp}`);
  }

  /**
   * Verify phone OTP
   */
  async verifyPhone(data: VerifyPhoneInput): Promise<boolean> {
    const storedOTP = await redisClient.get(`otp:${data.phoneNumber}`);
    
    if (!storedOTP || storedOTP !== data.otp) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    // Delete OTP after successful verification
    await redisClient.del(`otp:${data.phoneNumber}`);
    
    return true;
  }

  /**
   * Register a new user
   */
  async register(data: UserCreateInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingUser) {
      throw new AppError('Phone number already registered', 400);
    }

    // Check email if provided
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new AppError('Email already registered', 400);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        email: data.email,
        password: hashedPassword,
        dateOfBirth: new Date(data.dateOfBirth),
      },
    });

    // Create default personal account
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        username: data.username,
        displayName: data.displayName || data.username,
        accountType: 'PERSONAL',
        subscriptionTier: 'FREE',
        bio: data.bio,
        pronouns: data.pronouns,
        isPrivate: this.isMinor(data.dateOfBirth), // Auto-private for minors
      },
    });

    // Generate JWT
    const token = this.generateToken(user.id, account.id);

    return {
      user: this.sanitizeUser(user),
      account: this.sanitizeAccount(account),
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    // Find user by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: data.identifier },
          { email: data.identifier },
        ],
      },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Get primary account (first one)
    const primaryAccount = user.accounts[0];

    // Generate JWT
    const token = this.generateToken(user.id, primaryAccount.id);

    // Log login
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: data.ipAddress,
        deviceInfo: data.deviceInfo,
        location: data.location,
        status: 'SUCCESS',
      },
    });

    return {
      user: this.sanitizeUser(user),
      accounts: user.accounts.map(a => this.sanitizeAccount(a)),
      primaryAccount: this.sanitizeAccount(primaryAccount),
      token,
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, accountId: string): string {
    return jwt.sign(
      { userId, accountId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRY }
    );
  }

  /**
   * Check if user is minor (under 18)
   */
  private isMinor(dateOfBirth: Date | string): boolean {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      return age - 1 < 18;
    }
    return age < 18;
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Sanitize account object
   */
  private sanitizeAccount(account: any) {
    // Remove any sensitive account data if needed
    return account;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(identifier: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    
    // Store in Redis (expires in 1 hour)
    await redisClient.setex(
      `reset:${resetToken}`,
      3600,
      user.id
    );

    // Send reset link (SMS or email)
    if (user.email) {
      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      await sendEmail(user.email, 'Password Reset', `Click here to reset your password: ${resetLink}`);
    } else {
      // Send SMS with code instead
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      await redisClient.setex(`reset:code:${user.phoneNumber}`, 3600, resetCode);
      await sendSMS(user.phoneNumber, `Your password reset code is: ${resetCode}`);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    const userId = await redisClient.get(`reset:${token}`);
    
    if (!userId) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await redisClient.del(`reset:${token}`);

    // Log password change
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'PASSWORD_RESET',
        status: 'SUCCESS',
      },
    });
  }
}