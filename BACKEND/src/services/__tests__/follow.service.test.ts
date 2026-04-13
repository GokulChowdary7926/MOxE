import { FollowService } from '../follow.service';
import { AppError } from '../../utils/AppError';

jest.mock('../../server', () => ({
  prisma: {
    block: { findUnique: jest.fn().mockResolvedValue(null) },
    account: { findUnique: jest.fn().mockResolvedValue({ id: 'target', isPrivate: true }) },
    follow: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    followRequest: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('FollowService', () => {
  const service = new FollowService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.block.findUnique.mockResolvedValue(null);
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    mockPrisma.followRequest.findUnique.mockResolvedValue(null);
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'target', isPrivate: true });
  });

  it('returns isRequested when follow request exists', async () => {
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    mockPrisma.followRequest.findUnique.mockResolvedValue({ id: 'fr1' });
    const status = await service.getFollowStatus('viewer', 'target');
    expect(status).toEqual({
      isFollowing: false,
      isFavorite: false,
      isRequested: true,
      followRequested: true,
      canFollow: true,
    });
  });

  it('returns pending true when following private account', async () => {
    const result = await service.follow('viewer', 'target');
    expect(result).toEqual({ ok: true, pending: true });
    expect(mockPrisma.followRequest.create).toHaveBeenCalled();
  });

  it('follows public account immediately', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'target', isPrivate: false });
    const result = await service.follow('viewer', 'target');
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.follow.create).toHaveBeenCalled();
  });

  it('throws 400 when trying to follow self', async () => {
    await expect(service.follow('viewer', 'viewer')).rejects.toThrow(AppError);
  });

  it('throws 404 when target account does not exist', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    await expect(service.follow('viewer', 'missing')).rejects.toThrow(AppError);
  });

  it('throws 403 when active block exists', async () => {
    mockPrisma.block.findUnique
      .mockResolvedValueOnce({ expiresAt: null })
      .mockResolvedValueOnce(null);
    await expect(service.follow('viewer', 'target')).rejects.toThrow(AppError);
  });

  it('unfollow removes follow and pending request', async () => {
    const result = await service.unfollow('viewer', 'target');
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.follow.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.followRequest.deleteMany).toHaveBeenCalled();
  });

  it('removeFollower throws 400 for self removal', async () => {
    await expect(service.removeFollower('a1', 'a1')).rejects.toThrow(AppError);
  });

  it('removeFollower throws 404 when follower relation missing', async () => {
    mockPrisma.follow.deleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.removeFollower('owner', 'follower')).rejects.toThrow(AppError);
  });

  it('lists and manages follow requests', async () => {
    mockPrisma.followRequest.findMany.mockResolvedValueOnce([
      {
        id: 'r1',
        requester: { id: 'u1', username: 'alice', displayName: 'Alice', profilePhoto: null },
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    await expect(service.listPendingFollowRequests('owner')).resolves.toEqual([
      {
        id: 'r1',
        requesterId: 'u1',
        username: 'alice',
        displayName: 'Alice',
        profilePhoto: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    mockPrisma.followRequest.findFirst.mockResolvedValueOnce({ id: 'r1', requesterId: 'u1' });
    await expect(service.approveFollowRequest('owner', 'r1')).resolves.toEqual({ ok: true });
    expect(mockPrisma.$transaction).toHaveBeenCalled();

    mockPrisma.followRequest.deleteMany.mockResolvedValueOnce({ count: 1 });
    await expect(service.declineFollowRequest('owner', 'r1')).resolves.toEqual({ ok: true });
  });

  it('throws 404 when follow request missing for approve/decline', async () => {
    mockPrisma.followRequest.findFirst.mockResolvedValueOnce(null);
    await expect(service.approveFollowRequest('owner', 'missing')).rejects.toThrow(AppError);

    mockPrisma.followRequest.deleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.declineFollowRequest('owner', 'missing')).rejects.toThrow(AppError);
  });

  it('updates favorite status and lists follow relations', async () => {
    mockPrisma.follow.findUnique.mockResolvedValueOnce({ id: 'f1', isFavorite: false });
    await expect(service.setFavorite('viewer', 'target', true)).resolves.toEqual({ ok: true });
    expect(mockPrisma.follow.update).toHaveBeenCalled();

    mockPrisma.follow.findMany.mockResolvedValueOnce([
      { following: { id: 'u2', username: 'bob', displayName: 'Bob', profilePhoto: null } },
    ]);
    await expect(service.listFavorites('viewer')).resolves.toEqual([
      { id: 'u2', username: 'bob', displayName: 'Bob', profilePhoto: null },
    ]);

    mockPrisma.follow.findMany.mockResolvedValueOnce([
      { follower: { id: 'u3', username: 'charlie', displayName: 'Charlie', profilePhoto: null } },
    ]);
    await expect(service.listMyFollowers('owner')).resolves.toEqual([
      { id: 'u3', username: 'charlie', displayName: 'Charlie', profilePhoto: null },
    ]);

    mockPrisma.account.findUnique.mockResolvedValueOnce({ id: 'owner' });
    mockPrisma.follow.findMany.mockResolvedValueOnce([
      { follower: { id: 'u4', username: 'dana', displayName: 'Dana', profilePhoto: null } },
    ]);
    await expect(service.listFollowersByUsername('owner-user')).resolves.toEqual([
      { id: 'u4', username: 'dana', displayName: 'Dana', profilePhoto: null },
    ]);

    mockPrisma.follow.findMany.mockResolvedValueOnce([
      { following: { id: 'u5', username: 'erin', displayName: 'Erin', profilePhoto: null } },
    ]);
    await expect(service.listFollowing('viewer')).resolves.toEqual([
      { id: 'u5', username: 'erin', displayName: 'Erin', profilePhoto: null },
    ]);
  });

  it('throws when not following for setFavorite and username missing', async () => {
    mockPrisma.follow.findUnique.mockResolvedValueOnce(null);
    await expect(service.setFavorite('viewer', 'target', true)).rejects.toThrow(AppError);

    mockPrisma.account.findUnique.mockResolvedValueOnce(null);
    await expect(service.listFollowersByUsername('missing')).rejects.toThrow(AppError);
  });

  it('returns self and existing-follow status branches', async () => {
    const self = await service.getFollowStatus('same', 'same');
    expect(self.canFollow).toBe(false);

    mockPrisma.follow.findUnique.mockResolvedValueOnce({ id: 'f2', isFavorite: true });
    const following = await service.getFollowStatus('viewer', 'target');
    expect(following).toMatchObject({ isFollowing: true, isFavorite: true, isRequested: false });
  });
});
