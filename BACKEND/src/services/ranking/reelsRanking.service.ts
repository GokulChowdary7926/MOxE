import { prisma } from '../../server';
import { BaseRankingService, RankingScore } from './baseRanking.service';

export class ReelsRankingService extends BaseRankingService {
  /**
   * Rank reels for a viewer using recency and aggregate engagement.
   * This is a first pass that can be enriched with watch time and
   * interaction logs later.
   */
  async getRankedReels(viewerAccountId: string | null, limit = 40): Promise<RankingScore[]> {
    // Candidate set: recent reels, mixing followed accounts and global trending.
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const whereFollowed: any = { createdAt: { gte: since }, privacy: 'PUBLIC' };
    if (viewerAccountId) {
      const following = await prisma.follow.findMany({
        where: { followerId: viewerAccountId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      if (followingIds.length) {
        whereFollowed.accountId = { in: followingIds };
      }
    }

    const followedReels = await prisma.reel.findMany({
      where: whereFollowed,
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit * 0.6),
    });

    const trendingReels = await prisma.reel.findMany({
      where: {
        createdAt: { gte: since },
        privacy: 'PUBLIC',
      },
      orderBy: [
        { likes: 'desc' },
        { views: 'desc' },
      ],
      take: Math.floor(limit * 0.8),
    });

    const byId = new Map<string, typeof followedReels[number]>();
    for (const r of [...followedReels, ...trendingReels]) {
      byId.set(r.id, r);
    }
    const candidates = Array.from(byId.values());
    if (!candidates.length) return [];

    const scored: RankingScore[] = candidates.map((reel) => {
      const engagementRaw =
        (reel.likes || 0) * 1 +
        (reel.comments || 0) * 2 +
        (reel.shares || 0) * 3 +
        (reel.saves || 0) * 2;
      const engagement = Math.min(1, engagementRaw / 200);
      const recency = this.calculateRecencyScore(reel.createdAt);
      const score = engagement * 0.6 + recency * 0.4;
      return {
        itemId: reel.id,
        score,
        signals: {
          engagement,
          recency,
        },
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}

