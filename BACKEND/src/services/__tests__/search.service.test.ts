import { SearchService } from '../search.service';

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('SearchService', () => {
  const service = new SearchService();
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
    delete process.env.ALGOLIA_APP_ID;
    delete process.env.ALGOLIA_API_KEY;
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('isEnabled returns false without Algolia env keys', () => {
    expect(service.isEnabled()).toBe(false);
  });

  it('isEnabled returns true with Algolia env keys', () => {
    process.env.ALGOLIA_APP_ID = 'app';
    process.env.ALGOLIA_API_KEY = 'key';
    expect(service.isEnabled()).toBe(true);
  });

  it('searchUsers returns empty for blank query', async () => {
    const result = await service.searchUsers('   ');
    expect(result).toEqual([]);
    expect(mockPrisma.account.findMany).not.toHaveBeenCalled();
  });

  it('searchPosts queries prisma for non-empty query', async () => {
    mockPrisma.post.findMany.mockResolvedValue([{ id: 'p1' }]);
    const result = await service.searchPosts('moxe', 5);
    expect(result).toEqual([{ id: 'p1' }]);
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        where: expect.objectContaining({
          isDeleted: false,
          isArchived: false,
        }),
      }),
    );
  });
});
