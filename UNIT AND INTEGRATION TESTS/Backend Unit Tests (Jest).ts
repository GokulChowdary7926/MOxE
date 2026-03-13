// backend/tests/unit/auth.service.test.ts

import { AuthService } from '../../src/services/auth.service';
import { prisma } from '../../src/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { redisClient } from '../../src/server';

jest.mock('../../src/server', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    account: {
      create: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
  },
  redisClient: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/notifications');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('sendPhoneVerification', () => {
    it('should send OTP successfully', async () => {
      const phoneNumber = '+1234567890';
      
      // Mock rate limit check
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      
      await authService.sendPhoneVerification(phoneNumber);

      expect(redisClient.setex).toHaveBeenCalledWith(
        expect.stringContaining(`otp:${phoneNumber}`),
        600,
        expect.any(String)
      );
      expect(redisClient.incr).toHaveBeenCalledWith(expect.stringContaining(`sms:${phoneNumber}`));
    });

    it('should throw error on too many attempts', async () => {
      const phoneNumber = '+1234567890';
      
      // Mock rate limit exceeded
      (redisClient.get as jest.Mock).mockResolvedValue('3');

      await expect(authService.sendPhoneVerification(phoneNumber))
        .rejects.toThrow('Too many verification attempts');
    });
  });

  describe('register', () => {
    const mockUserData = {
      phoneNumber: '+1234567890',
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      displayName: 'Test User',
      dateOfBirth: '1990-01-01',
    };

    it('should register new user successfully', async () => {
      // Mock no existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock password hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      // Mock user creation
      const mockUser = { id: 'user123', ...mockUserData, password: 'hashedPassword' };
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock account creation
      const mockAccount = { id: 'account123', userId: 'user123', username: 'testuser' };
      (prisma.account.create as jest.Mock).mockResolvedValue(mockAccount);
      
      // Mock JWT
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const result = await authService.register(mockUserData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('account');
      expect(result).toHaveProperty('token', 'jwt-token');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.account.create).toHaveBeenCalled();
    });

    it('should throw error if phone number already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(authService.register(mockUserData))
        .rejects.toThrow('Phone number already registered');
    });
  });
});