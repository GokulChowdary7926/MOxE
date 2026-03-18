import { prisma } from '../../server';

export interface RankingScore {
  itemId: string;
  score: number;
  signals?: Record<string, unknown>;
}

/**
 * Base helper for ranking services.
 * Right now this only provides shared helpers; caching and generic interaction
 * recording can be layered on later without breaking callers.
 */
export abstract class BaseRankingService {
  /**
   * Sigmoid-style recency score based on age in hours.
   * Newer items get scores near 1, older items decay smoothly toward 0.
   */
  protected calculateRecencyScore(createdAt: Date): number {
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return 1 / (1 + Math.exp(ageHours / 24 - 3));
  }

  /**
   * Apply negative signals (SKIP, NOT_INTERESTED, REPORT) as a penalty.
   * This is a simple linear penalty; surfaces can override with more
   * sophisticated logic if needed.
   */
  protected applyNegativeSignals(
    baseScore: number,
    negatives: { interactionType: string }[]
  ): number {
    if (!negatives.length) return baseScore;
    let penalty = 0;
    for (const n of negatives) {
      if (n.interactionType === 'SKIP') penalty -= 0.2;
      else if (n.interactionType === 'NOT_INTERESTED') penalty -= 0.5;
      else if (n.interactionType === 'REPORT') penalty -= 1.0;
    }
    return Math.max(0, baseScore + penalty);
  }

  /**
   * Simple cosine-similarity placeholder for future embedding-based ranking.
   * For now returns 0.5 when no usable vectors are present.
   */
  protected calculateCosineSimilarity(a?: unknown, b?: unknown): number {
    // Until real vectors are plugged in, return a neutral score.
    return 0.5;
  }
}

