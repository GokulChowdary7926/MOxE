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
  private async canViewerAccessSocialGraph(targetAccountId: string, viewerAccountId?: string | null): Promise<boolean> {
    // Backward compatibility for internal call-sites/tests that did not provide viewer context.
    if (viewerAccountId === undefined) return true;
    if (!viewerAccountId) return false;
    if (viewerAccountId === targetAccountId) return true;
    const [target, follow, viewerBlockedTarget, targetBlockedViewer] = await Promise.all([
      prisma.account.findUnique({
        where: { id: targetAccountId },
        select: { isPrivate: true },
      }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerAccountId, followingId: targetAccountId } },
        select: { followerId: true },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewerAccountId, blockedId: targetAccountId } },
        select: { expiresAt: true },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: targetAccountId, blockedId: viewerAccountId } },
        select: { expiresAt: true },
      }),
    ]);
    if (!target) return false;
    const now = new Date();
    const isActive = (expiresAt: Date | null) => expiresAt == null || expiresAt > now;
    if (
      (viewerBlockedTarget && isActive(viewerBlockedTarget.expiresAt))
      || (targetBlockedViewer && isActive(targetBlockedViewer.expiresAt))
    ) {
      return false;
    }
    if (!target.isPrivate) return true;
    return !!follow;
  }

  private async assertNoActiveBlockBetween(a: string, b: string): Promise<void> {
    const [aBlockedB, bBlockedA] = await Promise.all([
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: a, blockedId: b } },
        select: { expiresAt: true },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: b, blockedId: a } },
        select: { expiresAt: true },
      }),
    ]);
    const now = new Date();
    const isActive = (expiresAt: Date | null) => expiresAt == null || expiresAt > now;
    if (aBlockedB && isActive(aBlockedB.expiresAt)) {
      throw new AppError('You cannot follow an account you have blocked', 403);
    }
    if (bBlockedA && isActive(bBlockedA.expiresAt)) {
      throw new AppError('You cannot follow this account', 403);
    }
  }

  async follow(followerId: string, followingId: string): Promise<{ ok: boolean; pending?: boolean }> {
    if (followerId === followingId) throw new AppError('Cannot follow yourself', 400);
    await this.assertNoActiveBlockBetween(followerId, followingId);
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
  async listFollowersByUsername(
    username: string,
    viewerAccountId?: string | null,
  ): Promise<{ id: string; username: string; displayName: string; profilePhoto: string | null }[]> {
    const account = typeof (prisma.account as any).findFirst === 'function'
      ? await (prisma.account as any).findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
          select: { id: true },
        })
      : await prisma.account.findUnique({
          where: { username },
          select: { id: true },
        });
    if (!account) throw new AppError('Account not found', 404);
    const canAccess = await this.canViewerAccessSocialGraph(account.id, viewerAccountId);
    if (!canAccess) return [];
    return this.listMyFollowers(account.id);
  }

  /** List following of the account with the given username (for public profile following list). */
  async listFollowingByUsername(
    username: string,
    viewerAccountId?: string | null,
  ): Promise<{ id: string; username: string; displayName: string; profilePhoto: string | null }[]> {
    const account = typeof (prisma.account as any).findFirst === 'function'
      ? await (prisma.account as any).findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
          select: { id: true },
        })
      : await prisma.account.findUnique({
          where: { username },
          select: { id: true },
        });
    if (!account) throw new AppError('Account not found', 404);
    const canAccess = await this.canViewerAccessSocialGraph(account.id, viewerAccountId);
    if (!canAccess) return [];
    return this.listFollowing(account.id);
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

  async getFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<{
    isFollowing: boolean;
    isFavorite: boolean;
    isRequested: boolean;
    followRequested: boolean;
    canFollow: boolean;
  }> {
    if (followerId === followingId) {
      return {
        isFollowing: true,
        isFavorite: false,
        isRequested: false,
        followRequested: false,
        canFollow: false,
      };
    }
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (follow) {
      return {
        isFollowing: true,
        isFavorite: follow.isFavorite,
        isRequested: false,
        followRequested: false,
        canFollow: true,
      };
    }
    const req = await prisma.followRequest.findUnique({
      where: { requesterId_accountId: { requesterId: followerId, accountId: followingId } },
    });
    const isRequested = !!req;
    return {
      isFollowing: false,
      isFavorite: false,
      isRequested,
      followRequested: isRequested,
      canFollow: true,
    };
  }
}
