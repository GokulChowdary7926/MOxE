import { AppError } from '../../utils/AppError';
import {
  createMemorializationRequest,
  createProfileClaimRequest,
  adminReviewMemorializationRequest,
  adminReviewProfileClaim,
} from '../legal.service';

jest.mock('../../server', () => ({
  prisma: {
    memorializationRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profileClaimRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('legal.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields for memorialization request', async () => {
    await expect(
      createMemorializationRequest('a1', { subjectUsername: '', relationship: 'sibling', details: 'x' }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('creates profile claim request with normalized username', async () => {
    mockPrisma.profileClaimRequest.create.mockResolvedValue({ id: 'pc1', targetUsername: 'target' });
    const result = await createProfileClaimRequest('a1', { targetUsername: '@target', justification: 'I own this' });
    expect(result.id).toBe('pc1');
    expect(mockPrisma.profileClaimRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetUsername: 'target' }),
      }),
    );
  });

  it('adminReviewMemorializationRequest rejects non-pending requests', async () => {
    mockPrisma.memorializationRequest.findUnique.mockResolvedValue({ id: 'm1', status: 'APPROVED' });
    await expect(adminReviewMemorializationRequest('m1', 'APPROVED')).rejects.toBeInstanceOf(AppError);
  });

  it('adminReviewProfileClaim updates pending request', async () => {
    mockPrisma.profileClaimRequest.findUnique.mockResolvedValue({ id: 'p1', status: 'PENDING' });
    mockPrisma.profileClaimRequest.update.mockResolvedValue({ id: 'p1', status: 'REJECTED' });
    const result = await adminReviewProfileClaim('p1', 'REJECTED');
    expect(result.status).toBe('REJECTED');
  });
});
