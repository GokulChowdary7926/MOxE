import { prisma } from '../../server';
import { BaseRankingService, RankingScore } from './baseRanking.service';

export class JobFeedRankingService extends BaseRankingService {
  /**
   * Rank job/professional items for a JOB account.
   * Uses a simple approximation of skill/role match + recency + quality.
   */
  async getRankedItems(accountId: string, limit = 50): Promise<RankingScore[]> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });
    if (!account?.userId) return [];

    const profile = await prisma.userEmbedding
      .findUnique({ where: { userId: account.userId } })
      .catch(() => null);

    const skills: string[] =
      (profile?.professionalIntent as any)?.skills || [];
    const targetRoles: string[] =
      (profile?.professionalIntent as any)?.targetRoles || [];

    const jobs = await prisma.jobPosting.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: limit * 3,
    });

    const scores: RankingScore[] = jobs.map((job) => {
      let score = 0;

      const text = `${job.title} ${job.description || ''}`.toLowerCase();

      const skillMatch =
        skills.length > 0
          ? skills.filter((s) => text.includes(s.toLowerCase())).length /
            skills.length
          : 0;
      score += skillMatch * 0.5;

      const roleMatch =
        targetRoles.length > 0
          ? targetRoles.filter((r) => text.includes(r.toLowerCase())).length /
            targetRoles.length
          : 0;
      score += roleMatch * 0.2;

      const recency = this.calculateRecencyScore(job.createdAt);
      score += recency * 0.2;

      const quality = Math.min(1, (job.applicationCount || 0) / 50);
      score += quality * 0.1;

      return {
        itemId: job.id,
        score,
        signals: { skillMatch, roleMatch, recency, quality },
      };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  }
}

