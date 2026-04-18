jest.mock('../review.service', () => ({
  ReviewService: jest.fn().mockImplementation(() => ({
    getRatingForSeller: jest.fn().mockResolvedValue({ rating: 4.8, reviewsCount: 0 }),
  })),
}));

jest.mock('../ad-billing.service', () => ({
  AdBillingService: jest.fn().mockImplementation(() => ({
    recordSpend: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../fraud.service', () => ({
  FraudService: jest.fn().mockImplementation(() => ({
    recordAdEventSignal: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    analyticsEvent: { create: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');
const { AnalyticsService } = require('../analytics.service');
export {};

describe('AnalyticsService', () => {
  const service = new AnalyticsService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recordEvent rejects invalid event type', async () => {
    await expect(service.recordEvent('a1', 'bad_event')).rejects.toThrow('Invalid event type');
  });

  it('recordEvent rejects unknown account', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    await expect(service.recordEvent('a1', 'profile_visit')).rejects.toThrow('Account not found');
  });

  it('recordEvent creates analytics event for valid type', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'a1' });
    mockPrisma.analyticsEvent.create.mockResolvedValue({});
    await service.recordEvent('a1', 'profile_visit', { source: 'test' });
    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accountId: 'a1', eventType: 'profile_visit' }),
      }),
    );
  });
});
