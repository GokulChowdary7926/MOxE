import { AppError } from '../../utils/AppError';
import { createPayoutForPeriod, getPayout, listPayouts } from '../settlement.service';

jest.mock('../../server', () => ({
  prisma: {
    payout: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('settlement.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listPayouts returns seller payouts', async () => {
    mockPrisma.payout.findMany.mockResolvedValue([{ id: 'p1' }]);
    const rows = await listPayouts('seller1', 10);
    expect(rows).toEqual([{ id: 'p1' }]);
  });

  it('getPayout throws when missing', async () => {
    mockPrisma.payout.findFirst.mockResolvedValue(null);
    await expect(getPayout('seller1', 'p1')).rejects.toBeInstanceOf(AppError);
  });

  it('createPayoutForPeriod computes and creates payout', async () => {
    mockPrisma.order.findMany
      .mockResolvedValueOnce([{ id: 'o1', total: 100 }, { id: 'o2', total: 50 }])
      .mockResolvedValueOnce([{ total: 20 }]);
    mockPrisma.payout.findFirst.mockResolvedValue(null);
    mockPrisma.payout.create.mockResolvedValue({ id: 'p1', netAmount: 110 });

    const start = new Date('2026-01-01T00:00:00.000Z');
    const end = new Date('2026-01-08T00:00:00.000Z');
    const result = await createPayoutForPeriod('seller1', start, end, 10);
    expect(result.id).toBe('p1');
    expect(mockPrisma.payout.create).toHaveBeenCalled();
  });
});
