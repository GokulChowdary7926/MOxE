/**
 * FeedService tests – run each function multiple times (10+) to ensure stability.
 */
import { FeedService } from '../feed.service';

const mockPosts = [
  {
    id: 'p1',
    accountId: 'acc1',
    media: [],
    caption: 'Hi',
    location: null,
    createdAt: new Date(),
    account: {
      username: 'u1',
      displayName: 'User 1',
      profilePhoto: null,
      accountType: 'PERSONAL',
      verifiedBadge: false,
    },
    likes: [{ accountId: 'acc2' }],
    comments: [{ id: 'c1' }],
    ProductTag: [],
  },
];

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findUnique: jest.fn().mockResolvedValue({
        user: { dateOfBirth: new Date('1990-01-01') },
      }),
    },
    follow: { findMany: jest.fn().mockResolvedValue([{ followingId: 'acc2' }]) },
    block: { findMany: jest.fn().mockResolvedValue([]) },
    feedSnooze: { findMany: jest.fn().mockResolvedValue([]) },
    subscription: { findMany: jest.fn().mockResolvedValue([]) },
    post: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'p1',
          accountId: 'acc1',
          media: [],
          caption: 'Hi',
          location: null,
          createdAt: new Date(),
          account: {
            username: 'u1',
            displayName: 'User 1',
            profilePhoto: null,
            accountType: 'PERSONAL',
            verifiedBadge: false,
          },
          likes: [{ accountId: 'acc2' }],
          comments: [{ id: 'c1' }],
          ProductTag: [],
        },
      ]),
    },
    savedPost: { findMany: jest.fn().mockResolvedValue([]) },
    feedInteraction: {
      create: jest.fn().mockResolvedValue({}),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    adCampaign: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('FeedService', () => {
  const service = new FeedService();
  const RUNS = 12;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.account.findUnique.mockResolvedValue({
      user: { dateOfBirth: new Date('1990-01-01') },
    });
    mockPrisma.follow.findMany.mockResolvedValue([{ followingId: 'acc2' }]);
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.feedSnooze.findMany.mockResolvedValue([]);
    mockPrisma.subscription.findMany.mockResolvedValue([]);
    mockPrisma.post.findMany.mockResolvedValue(mockPosts);
    mockPrisma.savedPost.findMany.mockResolvedValue([]);
    mockPrisma.feedInteraction.groupBy.mockResolvedValue([]);
    mockPrisma.adCampaign.findMany.mockResolvedValue([]);
  });

  describe('getFeed', () => {
    it('returns items and nextCursor (run 12 times)', async () => {
      for (let i = 0; i < RUNS; i++) {
        const result = await service.getFeed('acc1', undefined, 20);
        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('nextCursor');
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items.length).toBeGreaterThanOrEqual(0);
        expect(mockPrisma.post.findMany).toHaveBeenCalled();
      }
      expect(mockPrisma.post.findMany).toHaveBeenCalledTimes(RUNS);
    });

    it('respects cursor when provided (run 12 times)', async () => {
      for (let i = 0; i < RUNS; i++) {
        await service.getFeed('acc1', 'cursor-id', 10);
        expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ cursor: { id: 'cursor-id' }, skip: 1 })
        );
      }
    });

    it('caps limit at MAX_LIMIT 50 (run 10 times)', async () => {
      for (let i = 0; i < 10; i++) {
        await service.getFeed('acc1', undefined, 100);
        expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 50 })
        );
      }
    });

    it('includes isLiked and isSaved on items (run 10 times)', async () => {
      mockPrisma.savedPost.findMany.mockResolvedValue([{ postId: 'p1' }]);
      for (let i = 0; i < 10; i++) {
        const result = await service.getFeed('acc1');
        expect(result.items.length).toBeGreaterThan(0);
        result.items.forEach((item: any) => {
          expect(item).toHaveProperty('isLiked');
          expect(item).toHaveProperty('isSaved');
        });
      }
    });
  });
});
