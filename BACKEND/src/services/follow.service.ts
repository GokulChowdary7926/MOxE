import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type FollowRequestItem = {
  id: string;
  requesterId: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
  createdAt: string;
};

export class FollowService {
  async follow(followerId: string, followingId: string): Promise<{ ok: boolean; pending?: boolean }> {
    if (followerId === followingId) throw new AppError('Cannot follow yourself', 400);
    const target = await prisma.account.findUnique({
      where: { id: followingId },
      select: { id: true, isPrivate: true },
    });
    if (!target) throw new AppError('Account not found', 404);

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existingFollow) return { ok: true };

    const existingRequest = await prisma.followRequest.findUnique({
      where: { requesterId_accountId: { requesterId: followerId, accountId: followingId } },
    });
    if (existingRequest) return { ok: true, pending: true };

    if (target.isPrivate) {
      await prisma.followRequest.create({
        data: { requesterId: followerId, accountId: followingId },
      });
      return { ok: true, pending: true };
    }

    await prisma.follow.create({
      data: { followerId, followingId },
    });
    return { ok: true };
  }

  async unfollow(followerId: string, followingId: string): Promise<{ ok: boolean }> {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
    await prisma.followRequest.deleteMany({
      where: { requesterId: followerId, accountId: followingId },
    });
    return { ok: true };
  }

  /** Remove a follower from my account (they stay following until we delete; no notification). Guide 1.2.3 */
  async removeFollower(accountId: string, followerId: string): Promise<{ ok: boolean }> {
    if (accountId === followerId) throw new AppError('Cannot remove yourself', 400);
    const deleted = await prisma.follow.deleteMany({
      where: { followingId: accountId, followerId },
    });
    if (deleted.count === 0) throw new AppError('Follower not found', 404);
    return { ok: true };
  }

  async listPendingFollowRequests(accountId: string): Promise<FollowRequestItem[]> {
    const rows = await prisma.followRequest.findMany({
      where: { accountId },
      include: {
        requester: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      requesterId: r.requester.id,
      username: r.requester.username,
      displayName: r.requester.displayName,
      profilePhoto: r.requester.profilePhoto,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async approveFollowRequest(accountId: string, requestId: string): Promise<{ ok: boolean }> {
    const req = await prisma.followRequest.findFirst({
      where: { id: requestId, accountId },
    });
    if (!req) throw new AppError('Request not found', 404);
    await prisma.$transaction([
      prisma.follow.create({
        data: { followerId: req.requesterId, followingId: accountId },
      }),
      prisma.followRequest.delete({ where: { id: requestId } }),
    ]);
    return { ok: true };
  }

  async declineFollowRequest(accountId: string, requestId: string): Promise<{ ok: boolean }> {
    const deleted = await prisma.followRequest.deleteMany({
      where: { id: requestId, accountId },
    });
    if (deleted.count === 0) throw new AppError('Request not found', 404);
    return { ok: true };
  }

  async setFavorite(followerId: string, followingId: string, isFavorite: boolean): Promise<{ ok: boolean }> {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!follow) throw new AppError('Not following this account', 404);
    await prisma.follow.update({
      where: { id: follow.id },
      data: { isFavorite },
    });
    return { ok: true };
  }

  async listFavorites(accountId: string): Promise<{ id: string; username: string; displayName: string; profilePhoto: string | null }[]> {
    const rows = await prisma.follow.findMany({
      where: { followerId: accountId, isFavorite: true },
      include: {
        following: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => r.following);
  }

  async listMyFollowers(accountId: string): Promise<{ id: string; username: string; displayName: string; profilePhoto: string | null }[]> {
    const rows = await prisma.follow.findMany({
      where: { followingId: accountId },
      include: {
        follower: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => r.follower);
  }

  /** List followers of the account with the given username (for public profile follower list). */
  async listFollowersByUsername(username: string): Promise<{ id: string; username: string; displayName: string; profilePhoto: string | null }[]> {
    const account = await prisma.account.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    return this.listMyFollowers(account.id);
  }

  async listFollowing(accountId: string): Promise<{ id: string; username: string; displayName: string; profilePhoto: string | null }[]> {
    const rows = await prisma.follow.findMany({
      where: { followerId: accountId },
      include: {
        following: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => r.following);
  }

  async getFollowStatus(followerId: string, followingId: string): Promise<{ isFollowing: boolean; isFavorite: boolean }> {
    if (followerId === followingId) {
      return { isFollowing: true, isFavorite: false };
    }
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!follow) return { isFollowing: false, isFavorite: false };
    return { isFollowing: true, isFavorite: follow.isFavorite };
  }
}
