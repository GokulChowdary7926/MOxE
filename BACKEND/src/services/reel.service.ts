import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class ReelService {
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
    return reel;
  }

  async list(viewerAccountId: string | null, cursor?: string, limit = 20) {
    let subscribedCreatorIds: string[] = [];
    if (viewerAccountId) {
      subscribedCreatorIds = await prisma.subscription
        .findMany({
          where: { subscriberId: viewerAccountId, status: 'ACTIVE' },
          select: { creatorId: true },
        })
        .then((r) => r.map((x) => x.creatorId));
    }
    const reels = await prisma.reel.findMany({
      where: {
        privacy: 'PUBLIC',
        OR: [
          { isSubscriberOnly: false },
          { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } },
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
    return { items: reels.slice(0, limit), nextCursor };
  }

  /** List reels by account (for profile grid). Public only, or own account. Subscriber-only visible to subscribers. */
  async listByAccount(viewerAccountId: string | null, accountId: string, cursor?: string, limit = 30) {
    const isOwn = viewerAccountId === accountId;
    let subscribedCreatorIds: string[] = [];
    if (viewerAccountId && !isOwn) {
      subscribedCreatorIds = await prisma.subscription
        .findMany({
          where: { subscriberId: viewerAccountId, status: 'ACTIVE' },
          select: { creatorId: true },
        })
        .then((r) => r.map((x) => x.creatorId));
    }
    const where: Prisma.ReelWhereInput = {
      accountId,
      ...(isOwn ? {} : { privacy: 'PUBLIC' as const }),
      ...(!isOwn && viewerAccountId
        ? {
            OR: [
              { isSubscriberOnly: false },
              { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } },
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
      items: reels.slice(0, limit).map((r: Row) => ({
        id: r.id,
        accountId: r.accountId,
        username: r.account.username,
        displayName: r.account.displayName,
        profilePhoto: r.account.profilePhoto,
        video: r.video,
        thumbnail: r.thumbnail,
        caption: r.caption,
        likeCount: r.likes,
        commentCount: r.comments,
        createdAt: r.createdAt,
      })),
      nextCursor,
    };
  }
}
