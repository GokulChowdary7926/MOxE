import { publishDueScheduledContent } from '../scheduling.service';

jest.mock('../../server', () => ({
  prisma: {
    post: { updateMany: jest.fn() },
    reel: { updateMany: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('scheduling.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishDueScheduledContent updates due posts and reels', async () => {
    mockPrisma.post.updateMany.mockResolvedValue({ count: 3 });
    mockPrisma.reel.updateMany.mockResolvedValue({ count: 2 });
    const result = await publishDueScheduledContent();
    expect(result).toEqual({ posts: 3, reels: 2 });
    expect(mockPrisma.post.updateMany).toHaveBeenCalled();
    expect(mockPrisma.reel.updateMany).toHaveBeenCalled();
  });
});
