import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { assertCommentMentionsAllowed } from './tagMentionPrivacy.service';
import { normalizeStoredMediaUrl } from '../utils/mediaUrl';

export class ReelService {
  private async assertCanViewReel(viewerAccountId: string | null, reelId: string) {
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
      select: {
        id: true,
        accountId: true,
        privacy: true,
        deletedAt: true,
        isSubscriberOnly: true,
        allowComments: true,
      },
    });
    if (!reel || reel.deletedAt) throw new AppError('Reel not found', 404);
    if (viewerAccountId === reel.accountId) return reel;
    if (!viewerAccountId) {
      if (reel.privacy !== 'PUBLIC' || reel.isSubscriberOnly) throw new AppError('Reel not found', 404);
      return reel;
    }
    if (reel.isSubscriberOnly) {
      const sub = await prisma.subscription.findFirst({
        where: { creatorId: reel.accountId, subscriberId: viewerAccountId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!sub) throw new AppError('Reel not found', 404);
    }
    if (reel.privacy === 'PUBLIC') return reel;
    if (reel.privacy === 'ONLY_ME') throw new AppError('Reel not found', 404);
    if (reel.privacy === 'FOLLOWERS_ONLY') {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerAccountId, followingId: reel.accountId } },
      });
      if (!follow) throw new AppError('Reel not found', 404);
      return reel;
    }
    if (reel.privacy === 'CLOSE_FRIENDS_ONLY') {
      const cf = await prisma.closeFriend.findUnique({
        where: { accountId_friendId: { accountId: reel.accountId, friendId: viewerAccountId } },
      });
      if (!cf) throw new AppError('Reel not found', 404);
      return reel;
    }
    return reel;
  }

  async getOneForViewer(viewViewerAccountId: string | null, reelId: string) {
    await this.assertCanViewReel(viewViewerAccountId, reelId);
    const reel = await prisma.reel.findFirst({
      where: { id: reelId, deletedAt: null },
      include: {
        account: {
          select: { id: true, username: true, displayName: true, profilePhoto: true, verifiedBadge: true },
        },
      },
    });
    if (!reel) return null;
    return {
      ...reel,
      video: await normalizeStoredMediaUrl(reel.video),
      thumbnail: await normalizeStoredMediaUrl(reel.thumbnail),
    };
  }

  async create(accountId: string, data: {
    video?: string;
    thumbnail?: string;
    caption?: string;
    duration?: number;
    media?: { url: string; thumbnail?: string }[];
    edits?: { trimStartMs?: number; trimEndMs?: number };
    audio?: unknown;
    speed?: number;
    effects?: unknown;
    privacy?: string;
    productTags?: { productId: string; x?: number; y?: number }[];
    isSubscriberOnly?: boolean;
    subscriberTierKeys?: string[] | null;
    isScheduled?: boolean;
    scheduledFor?: string;
  }) {
    // Accept either (video, thumbnail, duration) or (media array from frontend)
    let video: string;
    let thumbnail: string;
    let duration: number;
    if (Array.isArray(data.media) && data.media[0]?.url) {
      video = String(data.media[0].url);
      thumbnail = data.media[0].thumbnail ? String(data.media[0].thumbnail) : video;
      const trimStart = data.edits?.trimStartMs ?? 0;
      const trimEnd = data.edits?.trimEndMs ?? 15000;
      duration = Math.max(1, Math.min(90, (trimEnd - trimStart) / 1000)) || 15;
    } else if (data.video && data.thumbnail != null) {
      video = data.video;
      thumbnail = data.thumbnail;
      duration = data.duration ?? 15;
    } else {
      throw new AppError('Provide video and thumbnail, or media array with url', 400);
    }

    video = await normalizeStoredMediaUrl(video);
    thumbnail = await normalizeStoredMediaUrl(thumbnail);
    if (!video) throw new AppError('Invalid video URL', 400);

    const privacy = (data.privacy as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME') || 'PUBLIC';
    const productTags = Array.isArray(data.productTags) ? data.productTags.slice(0, 5) : [];
    if (productTags.length > 0) {
      const productIds = [...new Set(productTags.map((t) => t.productId))];
      const owned = await prisma.product.findMany({
        where: { id: { in: productIds }, accountId },
        select: { id: true },
      });
      const ownedIds = new Set(owned.map((p) => p.id));
      const invalid = productIds.filter((id) => !ownedIds.has(id));
      if (invalid.length > 0) throw new AppError('Invalid or unauthorized product in productTags', 400);
    }
    const reel = await prisma.reel.create({
      data: {
        accountId,
        video,
        thumbnail,
        caption: data.caption ?? null,
        duration,
        audio: (data.audio as any) ?? null,
        speed: data.speed ?? 1.0,
        effects: (data.effects as any) ?? {},
        privacy,
        isSubscriberOnly: data.isSubscriberOnly ?? false,
        subscriberTierKeys: data.subscriberTierKeys ? (data.subscriberTierKeys as any) : null,
        isScheduled: data.isScheduled ?? false,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    if (productTags.length > 0) {
      await prisma.productTag.createMany({
        data: productTags.map((t) => ({
          productId: t.productId,
          reelId: reel.id,
          postId: null,
          storyId: null,
          x: t.x ?? null,
          y: t.y ?? null,
        })),
      });
    }
    return {
      ...reel,
      video: await normalizeStoredMediaUrl(reel.video),
      thumbnail: await normalizeStoredMediaUrl(reel.thumbnail),
    };
  }

  async list(viewerAccountId: string | null, cursor?: string, limit = 20) {
    let subscribedCreatorIds: string[] = [];
    let allowedAccountIds: string[] | null = null;
    let closeFriendAuthorIds: string[] = [];
    if (viewerAccountId) {
      const [subs, followingRows, closeFriendRows, blockedByViewerRows, blockedViewerRows] = await Promise.all([
        prisma.subscription.findMany({
          where: { subscriberId: viewerAccountId, status: 'ACTIVE' },
          select: { creatorId: true },
        }),
        prisma.follow.findMany({
          where: { followerId: viewerAccountId },
          select: { followingId: true },
        }),
        prisma.closeFriend.findMany({
          where: { friendId: viewerAccountId },
          select: { accountId: true },
        }),
        prisma.block.findMany({
          where: { blockerId: viewerAccountId },
          select: { blockedId: true, expiresAt: true },
        }),
        prisma.block.findMany({
          where: { blockedId: viewerAccountId },
          select: { blockerId: true, expiresAt: true },
        }),
      ]);
      subscribedCreatorIds = subs.map((x) => x.creatorId);
      closeFriendAuthorIds = closeFriendRows.map((x) => x.accountId);
      const followingIds = followingRows.map((x) => x.followingId);
      const blockedByViewer = blockedByViewerRows
        .filter((x) => x.expiresAt == null || x.expiresAt > new Date())
        .map((x) => x.blockedId);
      const blockedViewer = blockedViewerRows
        .filter((x) => x.expiresAt == null || x.expiresAt > new Date())
        .map((x) => x.blockerId);
      const candidateAccountIds = [...new Set([viewerAccountId, ...followingIds, ...closeFriendAuthorIds])];
      const excluded = new Set([...blockedByViewer, ...blockedViewer]);
      allowedAccountIds = candidateAccountIds.filter((id) => !excluded.has(id));
    }
    const reels = await prisma.reel.findMany({
      where: {
        deletedAt: null,
        ...(allowedAccountIds ? { accountId: { in: allowedAccountIds } } : {}),
        OR: [
          ...(viewerAccountId
            ? [
                { accountId: viewerAccountId },
                { privacy: 'PUBLIC' as const },
                { privacy: 'FOLLOWERS_ONLY' as const },
                { privacy: 'CLOSE_FRIENDS_ONLY' as const, accountId: { in: closeFriendAuthorIds } },
              ]
            : [{ privacy: 'PUBLIC' as const }]),
        ],
        AND: [
          {
            OR: [
              { isSubscriberOnly: false },
              ...(viewerAccountId ? [{ isSubscriberOnly: true, accountId: viewerAccountId }] : []),
              { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    const nextCursor = reels.length > limit ? reels[limit - 1].id : null;
    const items = await Promise.all(
      reels.slice(0, limit).map(async (r) => ({
        ...r,
        video: await normalizeStoredMediaUrl(r.video),
        thumbnail: await normalizeStoredMediaUrl(r.thumbnail),
      })),
    );
    return { items, nextCursor };
  }

  /** List reels by account (for profile grid). Public only, or own account. Subscriber-only visible to subscribers. */
  async listByAccount(viewerAccountId: string | null, accountId: string, cursor?: string, limit = 30) {
    const isOwn = viewerAccountId === accountId;
    const targetAccount = await prisma.account.findUnique({
      where: { id: accountId },
      select: { isPrivate: true },
    });
    if (!targetAccount) return { items: [], nextCursor: null };
    let subscribedCreatorIds: string[] = [];
    let viewerFollows = false;
    let viewerIsCloseFriend = false;
    if (viewerAccountId && !isOwn) {
      const [subs, follow, closeFriend] = await Promise.all([
        prisma.subscription.findMany({
          where: { subscriberId: viewerAccountId, status: 'ACTIVE' },
          select: { creatorId: true },
        }),
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerAccountId, followingId: accountId } },
        }),
        prisma.closeFriend.findUnique({
          where: { accountId_friendId: { accountId, friendId: viewerAccountId } },
        }),
      ]);
      subscribedCreatorIds = subs.map((x) => x.creatorId);
      viewerFollows = !!follow;
      viewerIsCloseFriend = !!closeFriend;
    }
    if (!isOwn && targetAccount.isPrivate && !viewerFollows) {
      return { items: [], nextCursor: null };
    }
    const where: Prisma.ReelWhereInput = {
      accountId,
      deletedAt: null,
      ...(!isOwn
        ? {
            AND: [
              {
                OR: [
                  { privacy: 'PUBLIC' as const },
                  ...(viewerFollows ? [{ privacy: 'FOLLOWERS_ONLY' as const }] : []),
                  ...(viewerIsCloseFriend ? [{ privacy: 'CLOSE_FRIENDS_ONLY' as const }] : []),
                ],
              },
              ...(viewerAccountId
                ? [
                    {
                      OR: [
                        { isSubscriberOnly: false },
                        { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } },
                      ],
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };
    const reels = await prisma.reel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    const nextCursor = reels.length > limit ? reels[limit - 1].id : null;
    type Row = (typeof reels)[number];
    return {
      items: await Promise.all(
        reels.slice(0, limit).map(async (r: Row) => ({
          id: r.id,
          accountId: r.accountId,
          username: r.account.username,
          displayName: r.account.displayName,
          profilePhoto: r.account.profilePhoto,
          video: await normalizeStoredMediaUrl(r.video),
          thumbnail: await normalizeStoredMediaUrl(r.thumbnail),
          caption: r.caption,
          likeCount: r.likes,
          commentCount: r.comments,
          createdAt: r.createdAt,
        })),
      ),
      nextCursor,
    };
  }

  async listComments(viewerAccountId: string | null, reelId: string) {
    await this.assertCanViewReel(viewerAccountId, reelId);
    const rows = await prisma.reelComment.findMany({
      where: { reelId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
      take: 200,
    });
    return {
      items: rows.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        account: c.account,
      })),
    };
  }

  async addComment(accountId: string, reelId: string, content: string) {
    const reel = await this.assertCanViewReel(accountId, reelId);
    if (!reel.allowComments) throw new AppError('Comments are turned off for this reel', 403);
    const text = String(content || '').trim().slice(0, 500);
    if (!text) throw new AppError('Content is required', 400);
    await assertCommentMentionsAllowed(accountId, text);
    const row = await prisma.reelComment.create({
      data: { accountId, reelId, content: text },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    await prisma.reel.update({
      where: { id: reelId },
      data: { comments: { increment: 1 } },
    });
    return {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      account: row.account,
    };
  }
}
