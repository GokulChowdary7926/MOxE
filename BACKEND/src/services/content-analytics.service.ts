import { prisma } from '../server';

type ContentType = 'post' | 'reel' | 'story';

function ensureType(type: string): ContentType {
  if (type !== 'post' && type !== 'reel' && type !== 'story') {
    throw new Error('Invalid content type');
  }
  return type;
}

export class ContentAnalyticsService {
  async trackView(contentId: string, contentTypeRaw: string, ownerId: string, source?: string) {
    const contentType = ensureType(contentTypeRaw);
    const existing = await prisma.contentAnalytics.findUnique({
      where: { contentId_contentType: { contentId, contentType } },
      select: { playsSource: true },
    });
    const plays = (existing?.playsSource as Record<string, number> | null) ?? {};
    if (source) plays[source] = (plays[source] ?? 0) + 1;
    return prisma.contentAnalytics.upsert({
      where: { contentId_contentType: { contentId, contentType } },
      update: {
        views: { increment: 1 },
        impressions: { increment: 1 },
        playsSource: source ? (plays as object) : undefined,
      },
      create: {
        contentId,
        contentType,
        ownerId,
        views: 1,
        impressions: 1,
        reach: 1,
        playsSource: source ? ({ [source]: 1 } as object) : undefined,
      },
    });
  }

  async trackLike(contentId: string, contentTypeRaw: string, ownerId: string) {
    const contentType = ensureType(contentTypeRaw);
    return prisma.contentAnalytics.upsert({
      where: { contentId_contentType: { contentId, contentType } },
      update: { likes: { increment: 1 } },
      create: { contentId, contentType, ownerId, likes: 1 },
    });
  }

  async trackUnlike(contentId: string, contentTypeRaw: string) {
    const contentType = ensureType(contentTypeRaw);
    return prisma.contentAnalytics.updateMany({
      where: { contentId, contentType, likes: { gt: 0 } },
      data: { likes: { decrement: 1 } },
    });
  }

  async trackComment(contentId: string, contentTypeRaw: string, ownerId: string) {
    const contentType = ensureType(contentTypeRaw);
    return prisma.contentAnalytics.upsert({
      where: { contentId_contentType: { contentId, contentType } },
      update: { comments: { increment: 1 } },
      create: { contentId, contentType, ownerId, comments: 1 },
    });
  }

  async trackSave(contentId: string, contentTypeRaw: string, ownerId: string) {
    const contentType = ensureType(contentTypeRaw);
    return prisma.contentAnalytics.upsert({
      where: { contentId_contentType: { contentId, contentType } },
      update: { saves: { increment: 1 } },
      create: { contentId, contentType, ownerId, saves: 1 },
    });
  }

  async trackRetention(reelId: string, ownerId: string, second: number) {
    const safeSecond = Math.max(0, Math.floor(second));
    await prisma.reelRetention.upsert({
      where: { reelId_second: { reelId, second: safeSecond } },
      update: { viewers: { increment: 1 } },
      create: { reelId, ownerId, second: safeSecond, viewers: 1 },
    });
  }

  async getContentAnalyticsForOwner(ownerId: string, typeRaw: string, contentId: string) {
    const type = ensureType(typeRaw);
    if (type === 'post') {
      const post = await prisma.post.findFirst({ where: { id: contentId, accountId: ownerId }, select: { id: true } });
      if (!post) return null;
    } else if (type === 'reel') {
      const reel = await prisma.reel.findFirst({ where: { id: contentId, accountId: ownerId }, select: { id: true } });
      if (!reel) return null;
    } else {
      const story = await prisma.story.findFirst({ where: { id: contentId, accountId: ownerId }, select: { id: true } });
      if (!story) return null;
    }
    const analytics = await prisma.contentAnalytics.findUnique({
      where: { contentId_contentType: { contentId, contentType: type } },
    });
    const retention = type === 'reel'
      ? await prisma.reelRetention.findMany({
          where: { reelId: contentId, ownerId },
          orderBy: { second: 'asc' },
        })
      : [];
    return { analytics, retention };
  }

  async getCreatorAnalytics(ownerId: string, from?: Date, to?: Date) {
    const postWhere: any = { accountId: ownerId, isDeleted: false };
    const reelWhere: any = { accountId: ownerId };
    const storyWhere: any = { accountId: ownerId };
    if (from || to) {
      const createdAt: any = {};
      if (from) createdAt.gte = from;
      if (to) createdAt.lte = to;
      postWhere.createdAt = createdAt;
      reelWhere.createdAt = createdAt;
      storyWhere.createdAt = createdAt;
    }
    const [posts, reels, stories] = await Promise.all([
      prisma.post.findMany({ where: postWhere, select: { id: true, createdAt: true } }),
      prisma.reel.findMany({ where: reelWhere, select: { id: true, createdAt: true } }),
      prisma.story.findMany({ where: storyWhere, select: { id: true, createdAt: true } }),
    ]);
    const contentList = [
      ...posts.map((p) => ({ id: p.id, type: 'post' as const, createdAt: p.createdAt })),
      ...reels.map((r) => ({ id: r.id, type: 'reel' as const, createdAt: r.createdAt })),
      ...stories.map((s) => ({ id: s.id, type: 'story' as const, createdAt: s.createdAt })),
    ];
    if (!contentList.length) {
      return {
        totals: { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 },
        topContent: [],
      };
    }
    const analytics = await prisma.contentAnalytics.findMany({
      where: {
        ownerId,
        OR: contentList.map((c) => ({ contentId: c.id, contentType: c.type })),
      },
    });
    const totals = analytics.reduce(
      (acc, a) => {
        acc.views += a.views;
        acc.likes += a.likes;
        acc.comments += a.comments;
        acc.shares += a.shares;
        acc.saves += a.saves;
        acc.reach += a.reach;
        acc.impressions += a.impressions;
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 }
    );
    const topContent = contentList
      .map((c) => {
        const row = analytics.find((a) => a.contentId === c.id && a.contentType === c.type);
        const engagement = (row?.likes ?? 0) + (row?.comments ?? 0) + (row?.shares ?? 0);
        return { id: c.id, type: c.type, engagement, createdAt: c.createdAt, analytics: row ?? null };
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
    return { totals, topContent };
  }
}
