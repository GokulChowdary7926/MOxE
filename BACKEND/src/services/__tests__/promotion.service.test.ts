import { AppError } from '../../utils/AppError';
import { PromotionService } from '../promotion.service';

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    promotion: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    promotionEvent: { create: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('PromotionService', () => {
  const service = new PromotionService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list rejects non-business accounts', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ accountType: 'PERSONAL' });
    await expect(service.list('a1')).rejects.toBeInstanceOf(AppError);
  });

  it('create validates objective and minimum budget', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ accountType: 'BUSINESS' });
    await expect(
      service.create('a1', {
        name: 'Promo',
        objective: 'BAD_OBJECTIVE',
        budgetCents: 200,
      } as any),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('recordEvent ignores inactive promotions', async () => {
    mockPrisma.promotion.findUnique.mockResolvedValue({ id: 'p1', status: 'DRAFT' });
    await service.recordEvent('p1', 'IMPRESSION', 'viewer1');
    expect(mockPrisma.promotionEvent.create).not.toHaveBeenCalled();
  });

  it('recordEvent creates event for active promotions', async () => {
    mockPrisma.promotion.findUnique.mockResolvedValue({ id: 'p1', status: 'ACTIVE' });
    await service.recordEvent('p1', 'CLICK', 'viewer1');
    expect(mockPrisma.promotionEvent.create).toHaveBeenCalledWith({
      data: { promotionId: 'p1', eventType: 'CLICK', viewerId: 'viewer1' },
    });
  });
});
