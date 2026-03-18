import { prisma } from '../../server';

interface CandidateLike {
  id: string;
  kind: 'application' | 'recruitment';
  jobPostingId: string;
  status: string | null;
  rating: number | null;
  ratingCount?: number;
  createdAt: Date;
}

function computeCandidateScore(c: CandidateLike): number {
  let score = 0;

  // Base on rating (1–5) and count if available.
  if (c.rating != null) {
    score += c.rating * 2;
    if (c.ratingCount && c.ratingCount > 1) {
      score += Math.min(c.ratingCount, 5); // small boost for multiple reviews
    }
  }

  // Status-based boost.
  const status = (c.status || '').toUpperCase();
  if (status === 'OFFER') score += 3;
  if (status === 'INTERVIEW' || status === 'INTERVIEWING') score += 2;
  if (status === 'SCREENING') score += 1;
  if (status === 'REJECTED') score -= 4;

  // Recency (newer candidates get modest boost).
  const ageDays = (Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recency = 1 / (1 + Math.exp(ageDays / 7 - 2)); // ~1 within first 1–2 weeks
  score += recency * 2;

  return score;
}

export class RecruiterMatchService {
  /**
   * Rank candidates for a given jobPostingId.
   * Combines:
   * - recruiter rating
   * - stage/status
   * - number of interview feedback entries
   * - recency
   */
  async rankCandidatesForJob(jobPostingId: string, limit = 50) {
    const [apps, recs] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { jobPostingId },
        include: {
          interviews: {
            include: { feedbacks: true },
          },
        },
      }),
      prisma.recruitmentCandidate.findMany({
        where: { jobPostingId },
        include: {
          interviews: {
            include: { feedbacks: true },
          },
        },
      }),
    ]);

    const candidates: CandidateLike[] = [];

    for (const a of apps) {
      const feedbackCount =
        a.interviews?.reduce((acc, iv) => acc + (iv.feedbacks?.length || 0), 0) ||
        0;
      candidates.push({
        id: a.id,
        kind: 'application',
        jobPostingId,
        status: a.status || null,
        rating: a.rating ?? null,
        ratingCount: feedbackCount,
        createdAt: a.appliedAt,
      });
    }

    for (const c of recs) {
      const feedbackCount =
        c.interviews?.reduce((acc, iv) => acc + (iv.feedbacks?.length || 0), 0) ||
        0;
      candidates.push({
        id: c.id,
        kind: 'recruitment',
        jobPostingId,
        status: c.status || null,
        rating: c.rating ?? null,
        ratingCount: feedbackCount,
        createdAt: c.createdAt,
      });
    }

    const ranked = candidates
      .map((c) => ({ ...c, score: computeCandidateScore(c) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ranked;
  }

  /**
   * Suggest OPEN job postings for a candidate (application or recruitment candidate).
   * Very simple version: match on currentTitle / cover letter keywords to job title.
   */
  async suggestJobsForCandidate(kind: 'application' | 'recruitment', candidateId: string, limit = 10) {
    let title = '';
    let jobPostingId: string | null = null;

    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({
        where: { id: candidateId },
        include: { jobPosting: true, account: true },
      });
      if (!app) return [];
      jobPostingId = app.jobPostingId;
      // Use existing profile fields to approximate a candidate headline.
      title = app.account?.bio || app.account?.username || '';
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({
        where: { id: candidateId },
        include: { jobPosting: true },
      });
      if (!cand) return [];
      jobPostingId = cand.jobPostingId;
      title =
        [cand.currentTitle, cand.coverLetter, cand.portfolioUrl]
          .filter(Boolean)
          .join(' ') || '';
    }

    const tokens = tokenize(title);
    if (!tokens.length) {
      return prisma.jobPosting.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: 'OPEN',
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const scored = jobs
      .map((job) => {
        const text = `${job.title} ${job.description || ''}`.toLowerCase();
        let matches = 0;
        for (const t of tokens) {
          if (text.includes(t)) matches += 1;
        }
        // Bias slightly toward other jobs with same pipeline / same original jobPosting
        if (job.id === jobPostingId) matches += 1;
        return { job, score: matches };
      })
      .filter((j) => j.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.job);
  }

  /**
   * Very lightweight "hiring success" predictor:
   * aggregates historical offers and acceptance for a given jobPosting.
   */
  async getHiringSuccessStats(jobPostingId: string) {
    const [offers, applications] = await Promise.all([
      prisma.offer.findMany({
        where: { jobPostingId },
      }),
      prisma.jobApplication.count({
        where: { jobPostingId },
      }),
    ]);

    const totalOffers = offers.length;
    const accepted = offers.filter((o) => o.status === 'ACCEPTED').length;
    const declined = offers.filter((o) => o.status === 'DECLINED').length;

    const offerRate = applications > 0 ? totalOffers / applications : 0;
    const acceptanceRate = totalOffers > 0 ? accepted / totalOffers : 0;

    return {
      jobPostingId,
      totalApplications: applications,
      totalOffers,
      accepted,
      declined,
      offerRate,
      acceptanceRate,
    };
  }
}

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

