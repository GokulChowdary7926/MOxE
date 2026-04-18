import { AppError } from '../../utils/AppError';
import { CreatorSubscriptionService } from '../creatorSubscription.service';

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn(), update: jest.fn() },
    subscription: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('CreatorSubscriptionService', () => {
  const service = new CreatorSubscriptionService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('setTiers rejects unsupported account type', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ accountType: 'PERSONAL', subscriptionsEnabled: false });
    await expect(service.setTiers('a1', [])).rejects.toBeInstanceOf(AppError);
  });

  it('subscribe rejects self-subscription', async () => {
    await expect(service.subscribe('a1', 'a1', 'tier1')).rejects.toBeInstanceOf(AppError);
  });

  it('unsubscribe rejects when no active subscription', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    await expect(service.unsubscribe('sub1', 'creator1')).rejects.toBeInstanceOf(AppError);
  });
});
