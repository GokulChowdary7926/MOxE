import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationCode, verifyCode } from '../phoneVerification.service';
import { AppError } from '../../utils/AppError';

jest.mock('../../server', () => ({
  prisma: {
    phoneVerification: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    block: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../twilio.service', () => ({
  isTwilioConfigured: jest.fn(() => true),
  sendSms: jest.fn(async () => ({ ok: true })),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const { prisma: mockPrisma } = require('../../server');
const { isTwilioConfigured } = require('../twilio.service');

describe('phoneVerification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.phoneVerification.count.mockResolvedValue(0);
    mockPrisma.phoneVerification.create.mockResolvedValue({});
    mockPrisma.phoneVerification.deleteMany.mockResolvedValue({});
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.account.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'u1' });
    mockPrisma.account.create.mockResolvedValue({ id: 'a1' });
    mockPrisma.block.findMany.mockResolvedValue([]);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('jwt-token');
  });

  it('sendVerificationCode succeeds when Twilio configured', async () => {
    await expect(sendVerificationCode('9876543210')).resolves.toEqual({
      ok: true,
      message: 'Code sent',
    });
  });

  it('sendVerificationCode throws 503 when Twilio is unavailable', async () => {
    isTwilioConfigured.mockReturnValue(false);
    await expect(sendVerificationCode('9876543210')).rejects.toThrow(AppError);
  });

  it('verifyCode existing user login succeeds with valid password', async () => {
    mockPrisma.phoneVerification.findFirst.mockResolvedValue({
      id: 'pv1',
      code: '123456',
      attempts: 0,
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      password: 'hashed',
      accounts: [{ id: 'a1' }],
    });

    const result = await verifyCode('9876543210', '123456', { password: 'secret' });
    expect(result).toEqual({
      token: 'jwt-token',
      userId: 'u1',
      accountId: 'a1',
      isNewUser: false,
    });
  });

  it('verifyCode throws 401 for wrong code', async () => {
    mockPrisma.phoneVerification.findFirst.mockResolvedValue({
      id: 'pv1',
      code: '654321',
      attempts: 0,
    });
    await expect(verifyCode('9876543210', '123456', { password: 'secret' })).rejects.toThrow(AppError);
  });
});
