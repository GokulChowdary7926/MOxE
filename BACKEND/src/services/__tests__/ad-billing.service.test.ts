import { AppError } from '../../utils/AppError';
import { AdBillingService } from '../ad-billing.service';

jest.mock('../../server', () => ({
  prisma: {
    adBillingAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    adCreditTransaction: {
      aggregate: jest.fn(),
    },
    adInvoice: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('AdBillingService', () => {
  const service = new AdBillingService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.adBillingAccount.findUnique.mockReset();
    mockPrisma.adCreditTransaction.aggregate.mockReset();
  });

  it('topUpCredits rejects non-positive amount', async () => {
    await expect(service.topUpCredits('a1', 0)).rejects.toBeInstanceOf(AppError);
  });

  it('getSummary creates billing account when absent', async () => {
    mockPrisma.adBillingAccount.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'b1',
      accountId: 'a1',
      currency: 'USD',
      creditBalance: 0,
      monthlySpendLimit: null,
      hardLimit: false,
    });
    mockPrisma.adBillingAccount.create.mockResolvedValue({
      id: 'b1',
      accountId: 'a1',
      currency: 'USD',
      creditBalance: 0,
      monthlySpendLimit: null,
      hardLimit: false,
    });
    mockPrisma.adCreditTransaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    mockPrisma.adInvoice.findMany.mockResolvedValue([]);

    const summary = await service.getSummary('a1');
    expect(summary.accountId).toBe('a1');
    expect(mockPrisma.adBillingAccount.create).toHaveBeenCalled();
  });

  it('canServeImpression returns false when hard limit and insufficient balance', async () => {
    mockPrisma.adBillingAccount.findUnique.mockResolvedValue({
      id: 'b1',
      creditBalance: 0.1,
      hardLimit: true,
      monthlySpendLimit: null,
    });
    mockPrisma.adCreditTransaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    const allowed = await service.canServeImpression('a1', 0.5);
    expect(allowed).toBe(false);
  });
});
