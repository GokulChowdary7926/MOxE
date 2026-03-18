import { prisma } from '../../server';
import { BaseRankingService, RankingScore } from './baseRanking.service';

export class StoriesRankingService extends BaseRankingService {
  /**
   * Rank story trays (accounts with active stories) for a viewer.
   * Signals:
   * - view history (count of StoryView)
   * - reply count (StoryReply)
   * - relationship via StoryView/Reply volume
   * - completion proxy via viewedCount / story count
   */
  async getRankedAccounts(viewerAccountId: string, limit = 50): Promise<RankingScore[]> {
    // Find accounts the viewer follows.
    const following = await prisma.follow.findMany({
      where: { followerId: viewerAccountId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    if (!followingIds.length) return [];

    // Active stories in last 24h.
    const activeStories = await prisma.story.findMany({
      where: {
        accountId: { in: followingIds },
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        accountId: true,
        createdAt: true,
        viewedCount: true,
        replyCount: true,
      },
    });
    if (!activeStories.length) return [];

    const byAccount = new Map<string, typeof activeStories>();
    for (const s of activeStories) {
      const bucket = byAccount.get(s.accountId) ?? [];
      bucket.push(s);
      byAccount.set(s.accountId, bucket);
    }

    const scores: RankingScore[] = [];
    for (const [accountId, stories] of byAccount.entries()) {
      const storyCount = stories.length;
      const totalViews = stories.reduce((sum, s) => sum + (s.viewedCount || 0), 0);
      const totalReplies = stories.reduce((sum, s) => sum + (s.replyCount || 0), 0);

      // View history: more views of this account's stories → higher score.
      const viewHistoryScore = Math.min(1, totalViews / (storyCount * 50 || 1));
      // Reply activity.
      const replyScore = Math.min(1, totalReplies / (storyCount * 10 || 1));
      // Relationship proxy.
      const relationshipScore = this.calculateRecencyScore(
        stories.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).createdAt,
      );
      // Completion proxy: high viewedCount/storyCount.
      const completionRate = storyCount > 0 ? totalViews / storyCount : 0;
      const completionScore = Math.min(1, completionRate / 100);

      const score =
        viewHistoryScore * 0.3 +
        replyScore * 0.25 +
        relationshipScore * 0.2 +
        completionScore * 0.15;

      scores.push({
        itemId: accountId,
        score,
        signals: {
          viewHistoryScore,
          replyScore,
          relationshipScore,
          completionScore,
          storyCount,
        },
      });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  }
}

