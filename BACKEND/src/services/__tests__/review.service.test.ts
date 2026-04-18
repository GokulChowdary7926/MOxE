import { AppError } from '../../utils/AppError';
import { ReviewService } from '../review.service';

jest.mock('../../server', () => ({
  prisma: {
    order: { findUnique: jest.fn() },
    review: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
    },
    report: { create: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('ReviewService', () => {
  const service = new ReviewService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create rejects when order missing', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null);
    await expect(service.create('buyer1', 'o1', { rating: 5 })).rejects.toBeInstanceOf(AppError);
  });

  it('create rejects when order not delivered', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'buyer1',
      sellerId: 'seller1',
      status: 'PAID',
    });
    await expect(service.create('buyer1', 'o1', { rating: 5 })).rejects.toBeInstanceOf(AppError);
  });

  it('respond rejects when review not owned by seller', async () => {
    mockPrisma.review.findUnique.mockResolvedValue({ id: 'r1', sellerId: 'seller2' });
    await expect(service.respond('seller1', 'r1', 'thanks')).rejects.toBeInstanceOf(AppError);
  });

  it('getRatingForSeller maps aggregate result', async () => {
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.66 }, _count: { id: 3 } });
    const result = await service.getRatingForSeller('seller1');
    expect(result).toEqual({ rating: 4.7, reviewsCount: 3 });
  });
});
