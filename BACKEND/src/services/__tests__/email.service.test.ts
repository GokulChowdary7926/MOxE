import { AppError } from '../../utils/AppError';
import { EmailService } from '../email.service';

jest.mock('../../server', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailVerification: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('EmailService', () => {
  const service = new EmailService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requestVerification rejects invalid email format', async () => {
    await expect(service.requestVerification('u1', 'invalid')).rejects.toBeInstanceOf(AppError);
  });

  it('requestVerification rejects disposable email domain', async () => {
    await expect(service.requestVerification('u1', 'test@mailinator.com')).rejects.toBeInstanceOf(AppError);
  });

  it('verifyToken rejects missing token record', async () => {
    mockPrisma.emailVerification.findUnique.mockResolvedValue(null);
    await expect(service.verifyToken('bad')).rejects.toBeInstanceOf(AppError);
  });

  it('verifyToken updates user and deletes token when valid', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    mockPrisma.emailVerification.findUnique.mockResolvedValue({
      id: 'ev1',
      userId: 'u1',
      email: 'ok@example.com',
      expiresAt: future,
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.emailVerification.delete.mockResolvedValue({});

    const result = await service.verifyToken('good');
    expect(result).toEqual({ success: true, email: 'ok@example.com' });
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });
});
