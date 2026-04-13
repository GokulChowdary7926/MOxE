import { CommerceService } from '../commerce.service';

jest.mock('../../server', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('CommerceService.listPublicCatalog', () => {
  const service = new CommerceService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies minPrice and maxPrice range filters', async () => {
    mockPrisma.product.findMany.mockResolvedValue([]);

    await service.listPublicCatalog({
      minPrice: 100,
      maxPrice: 500,
      limit: 24,
    });

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: { gte: 100, lte: 500 },
        }),
      }),
    );
  });

  it('returns nextCursor when there are more rows', async () => {
    const rows = Array.from({ length: 3 }, (_v, i) => ({
      id: `p-${i + 1}`,
      name: `Product ${i + 1}`,
      price: (i + 1) * 100,
      isActive: true,
      accountId: 'a1',
      account: { id: 'a1', username: 'seller', displayName: 'Seller', profilePhoto: null },
    }));
    mockPrisma.product.findMany.mockResolvedValue(rows);

    const result = await service.listPublicCatalog({ limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBe('p-2');
  });
});

describe('CommerceService.getOrder', () => {
  const service = new CommerceService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes viewerRole buyer when account matches buyerId', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'ord1',
      buyerId: 'a-buyer',
      sellerId: 'a-sell',
      total: 10,
      status: 'DELIVERED',
      items: [],
      buyer: { id: 'a-buyer', username: 'b', displayName: null, profilePhoto: null },
      seller: { id: 'a-sell', username: 's', displayName: null, profilePhoto: null },
    });

    const o = await service.getOrder('a-buyer', 'ord1');

    expect(o.viewerRole).toBe('buyer');
    expect(o.id).toBe('ord1');
  });

  it('includes viewerRole seller when account matches sellerId', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'ord1',
      buyerId: 'a-buyer',
      sellerId: 'a-sell',
      total: 10,
      status: 'DELIVERED',
      items: [],
      buyer: { id: 'a-buyer', username: 'b', displayName: null, profilePhoto: null },
      seller: { id: 'a-sell', username: 's', displayName: null, profilePhoto: null },
    });

    const o = await service.getOrder('a-sell', 'ord1');

    expect(o.viewerRole).toBe('seller');
  });
});

describe('CommerceService.refundOrder', () => {
  const service = new CommerceService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.account.findUnique.mockResolvedValue({ accountType: 'BUSINESS' });
  });

  it('sets status REFUNDED when return is RECEIVED and payment is not Stripe PI', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'ord1',
      sellerId: 'a-sell',
      returnStatus: 'RECEIVED',
      refundedAt: null,
      paymentId: 'manual',
      status: 'DELIVERED',
      stripeRefundId: null,
    });
    mockPrisma.order.update.mockResolvedValue({ id: 'ord1', status: 'REFUNDED' });

    await service.refundOrder('a-sell', 'ord1');

    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord1' },
        data: expect.objectContaining({
          status: 'REFUNDED',
          returnStatus: 'REFUNDED',
        }),
      }),
    );
  });

  it('backfills status REFUNDED on idempotent call when already refunded in ledger', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'ord1',
      sellerId: 'a-sell',
      returnStatus: 'REFUNDED',
      refundedAt: new Date(),
      paymentId: 'pi_test',
      status: 'DELIVERED', // legacy row
      stripeRefundId: 're_1',
    });
    mockPrisma.order.update.mockResolvedValue({ id: 'ord1', status: 'REFUNDED' });

    await service.refundOrder('a-sell', 'ord1');

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'ord1' },
      data: { status: 'REFUNDED' },
    });
  });

  it('does not update when already fully marked REFUNDED', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'ord1',
      sellerId: 'a-sell',
      returnStatus: 'REFUNDED',
      refundedAt: new Date(),
      paymentId: 'manual',
      status: 'REFUNDED',
      stripeRefundId: null,
    });

    const r = await service.refundOrder('a-sell', 'ord1');

    expect(r.status).toBe('REFUNDED');
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });
});
