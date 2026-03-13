import { ExploreService } from '../explore.service';

jest.mock('../../server', () => ({
  prisma: {
    hashtag: { findMany: jest.fn().mockResolvedValue([{ id: 'h1', name: 'test', postCount: 10 }]) },
    block: { findMany: jest.fn().mockResolvedValue([]) },
    follow: { findMany: jest.fn().mockResolvedValue([]) },
    account: { findMany: jest.fn().mockResolvedValue([{ id: 'acc1', username: 'u1', displayName: 'User 1', profilePhoto: null, searchVisibility: 'EVERYONE' }]) },
    post: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('ExploreService', () => {
  const service = new ExploreService();
  const RUNS = 12;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.hashtag.findMany.mockResolvedValue([{ id: 'h1', name: 'test', postCount: 10 }]);
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.account.findMany.mockResolvedValue([{ id: 'acc1', username: 'u1', displayName: 'User 1', profilePhoto: null, searchVisibility: 'EVERYONE' }]);
    mockPrisma.post.findMany.mockResolvedValue([]);
  });

  it('getTrendingHashtags returns array (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.getTrendingHashtags();
      expect(Array.isArray(result)).toBe(true);
    }
    expect(mockPrisma.hashtag.findMany).toHaveBeenCalledTimes(RUNS);
  });

  it('search returns users, hashtags, posts (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.search('acc1', 'test', 'all');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('hashtags');
      expect(result).toHaveProperty('posts');
    }
  });

  it('search returns empty when query blank (run 10 times)', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await service.search('acc1', '   ', 'all');
      expect(result.users).toEqual([]);
      expect(result.hashtags).toEqual([]);
      expect(result.posts).toEqual([]);
    }
  });
});
