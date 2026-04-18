const mockPrisma = {
  contentAnalytics: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
  reelRetention: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  post: { findFirst: jest.fn(), findMany: jest.fn() },
  reel: { findFirst: jest.fn(), findMany: jest.fn() },
  story: { findFirst: jest.fn(), findMany: jest.fn() },
};

jest.mock('../../server', () => ({ prisma: mockPrisma }));

const { ContentAnalyticsService } = require('../content-analytics.service');
export {};

describe('ContentAnalyticsService', () => {
  const service = new ContentAnalyticsService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trackView rejects invalid content type', async () => {
    await expect(service.trackView('c1', 'bad', 'owner1')).rejects.toThrow('Invalid content type');
  });

  it('trackUnlike decrements likes only when > 0', async () => {
    mockPrisma.contentAnalytics.updateMany.mockResolvedValue({ count: 1 });
    const out = await service.trackUnlike('c1', 'post');
    expect(out).toEqual({ count: 1 });
  });

  it('getContentAnalyticsForOwner returns null when owner does not own content', async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);
    const out = await service.getContentAnalyticsForOwner('owner1', 'post', 'p1');
    expect(out).toBeNull();
  });
});
