import { prisma } from '../../server';
import { BaseRankingService, RankingScore } from './baseRanking.service';

type ExploreCandidate = {
  id: string;
  contentType: string;
  creatorId: string;
  createdAt: Date;
  engagementScore: number;
  viralityScore: number;
};

export class ExploreRankingService extends BaseRankingService {
  /**
   * Return ranked cross‑surface content ids for a user.
   * This uses ContentFeatures + UserEmbedding and a simple blend of
   * similarity, engagement, virality and recency.
   */
  async getRankedItems(userId: string, limit = 50): Promise<RankingScore[]> {
    const [embedding, features] = await Promise.all([
      prisma.userEmbedding.findUnique({ where: { userId } }).catch(() => null),
      prisma.contentFeatures.findMany({
        where: {
          contentType: { in: ['POST', 'REEL', 'JOB', 'PROJECT'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit * 4,
      }),
    ]);

    if (!features.length) return [];

    const scores: RankingScore[] = features.map((f) => {
      const candidate: ExploreCandidate = {
        id: f.contentId,
        contentType: f.contentType,
        creatorId: f.creatorId,
        createdAt: f.createdAt,
        engagementScore: f.engagementScore,
        viralityScore: f.viralityScore,
      };

      let score = 0;

      const sim = this.calculateCosineSimilarity(embedding?.embedding, f.features);
      score += sim * 0.4;

      const engagement = Math.min(1, candidate.engagementScore);
      score += engagement * 0.3;

      const virality = Math.min(1, candidate.viralityScore);
      score += virality * 0.15;

      const recency = this.calculateRecencyScore(candidate.createdAt);
      score += recency * 0.15;

      return {
        itemId: `${candidate.contentType}:${candidate.id}`,
        score,
        signals: { sim, engagement, virality, recency },
      };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  }
}

