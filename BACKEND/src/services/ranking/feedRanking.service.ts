import { prisma } from '../../server';
import { BaseRankingService } from './baseRanking.service';

type FeedItemBase = {
  id: string;
  accountId: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
};

/**
 * FeedRankingService: ranks feed items for a viewer using recency,
 * engagement and a lightweight relationship signal derived from
 * FeedInteraction. Generic in the item shape so callers can
 * preserve additional fields beyond the minimal ranking features.
 */
export class FeedRankingService extends BaseRankingService {
  async rank<T extends FeedItemBase>(accountId: string, items: T[]): Promise<T[]> {
    if (!items.length) return items;

    const postIds = items.map((i) => i.id);

    const [interactionCounts, creatorInteractionCounts] = await Promise.all([
      prisma.feedInteraction.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { _all: true },
      }),
      prisma.feedInteraction.groupBy({
        by: ['accountId'],
        where: {
          accountId,
          postId: { in: postIds },
        },
        _count: { _all: true },
      }),
    ]);

    const relationshipMap = new Map<string, number>();
    creatorInteractionCounts.forEach((row) => {
      relationshipMap.set(row.accountId, row._count._all);
    });

    const now = Date.now();
    const scored = items.map((item) => {
      const ageHours = (now - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
      const recency = 1 / (1 + Math.exp(ageHours / 24 - 3)); // sigmoid
      const engagementRaw = item.likeCount * 0.5 + item.commentCount * 1;
      const engagement = Math.min(1, engagementRaw / 100);
      const relRaw = relationshipMap.get(item.accountId) ?? 0;
      const relationship = Math.min(1, relRaw / 20);
      const score = recency * 0.4 + engagement * 0.35 + relationship * 0.25;
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
  }
}

