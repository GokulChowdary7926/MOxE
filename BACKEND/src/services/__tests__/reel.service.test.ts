import { ReelService } from '../reel.service';

jest.mock('../../server', () => ({
  prisma: {
    subscription: { findMany: jest.fn().mockResolvedValue([]) },
    follow: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
    closeFriend: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
    block: { findMany: jest.fn().mockResolvedValue([]) },
    account: { findUnique: jest.fn().mockResolvedValue({ isPrivate: true }) },
    reel: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('ReelService visibility', () => {
  const service = new ReelService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.subscription.findMany.mockResolvedValue([]);
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    mockPrisma.closeFriend.findMany.mockResolvedValue([]);
    mockPrisma.closeFriend.findUnique.mockResolvedValue(null);
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.account.findUnique.mockResolvedValue({ isPrivate: true });
    mockPrisma.reel.findMany.mockResolvedValue([]);
  });

  it('listByAccount returns empty for private account non-follower', async () => {
    const result = await service.listByAccount('viewer1', 'owner1');
    expect(result.items).toEqual([]);
    expect(mockPrisma.reel.findMany).not.toHaveBeenCalled();
  });

  it('listByAccount queries reels for approved follower', async () => {
    mockPrisma.follow.findUnique.mockResolvedValue({ id: 'f1' });
    await service.listByAccount('viewer1', 'owner1');
    expect(mockPrisma.reel.findMany).toHaveBeenCalled();
  });
});
