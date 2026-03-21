import { prisma } from '../server';
import { TrackSmartSuggestService } from '../services/job-algorithms/trackSmartSuggest.service';
import { KnowWorkConnectorService } from '../services/job-algorithms/knowWorkConnector.service';
import { RecruiterMatchService } from '../services/job-algorithms/recruiterMatch.service';

const trackSmart = new TrackSmartSuggestService();
const knowWork = new KnowWorkConnectorService();
const recruiterMatch = new RecruiterMatchService();

/**
 * Placeholder background jobs for MOxE JOB algorithms.
 * These are designed to be wired into a real scheduler (e.g. Bull, cron)
 * but are safe no-ops if never invoked.
 */

// Recompute simple job/candidate stats nightly.
export async function recomputeJobHiringStats(): Promise<void> {
  const jobs = await prisma.jobPosting.findMany({
    where: { status: 'OPEN' },
    select: { id: true },
    take: 500,
  });

  for (const job of jobs) {
    await recruiterMatch.getHiringSuccessStats(job.id);
  }
}

// Scan for at-risk issues across all active projects.
export async function scanAtRiskIssues(): Promise<void> {
  const projects = await prisma.trackProject.findMany({
    select: { id: true, accountId: true },
    take: 500,
  });

  for (const p of projects) {
    await trackSmart.flagAtRiskIssues(p.id);
  }
}

// Pre-warm retro drafts for recently active projects.
export async function precomputeRetroDrafts(): Promise<void> {
  const projects = await prisma.trackProject.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: { id: true },
  });

  for (const p of projects) {
    await knowWork.generateRetroDraft(p.id, 14);
  }
}

