import { AppError } from '../../utils/AppError';
import { reviewVerificationRequest } from '../verification.service';

jest.mock('../../server', () => ({
  prisma: {
    verificationRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    account: {
      update: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('verification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when request is missing', async () => {
    mockPrisma.verificationRequest.findUnique.mockResolvedValue(null);
    await expect(reviewVerificationRequest('missing', 'APPROVED')).rejects.toBeInstanceOf(AppError);
  });

  it('approves and grants badge for paid tier', async () => {
    mockPrisma.verificationRequest.findUnique
      .mockResolvedValueOnce({
        id: 'vr1',
        status: 'PENDING',
        account: { id: 'a1', subscriptionTier: 'THICK' },
      })
      .mockResolvedValueOnce({ id: 'vr1', status: 'APPROVED' });
    mockPrisma.verificationRequest.update.mockResolvedValue({});
    mockPrisma.account.update.mockResolvedValue({});

    const result = await reviewVerificationRequest('vr1', 'APPROVED');
    expect(result.verifiedBadgeGranted).toBe(true);
    expect(mockPrisma.account.update).toHaveBeenCalled();
  });

  it('approves without badge for FREE tier', async () => {
    mockPrisma.verificationRequest.findUnique
      .mockResolvedValueOnce({
        id: 'vr2',
        status: 'PENDING',
        account: { id: 'a2', subscriptionTier: 'FREE' },
      })
      .mockResolvedValueOnce({ id: 'vr2', status: 'APPROVED' });
    mockPrisma.verificationRequest.update.mockResolvedValue({});

    const result = await reviewVerificationRequest('vr2', 'APPROVED');
    expect(result.verifiedBadgeGranted).toBe(false);
  });
});
