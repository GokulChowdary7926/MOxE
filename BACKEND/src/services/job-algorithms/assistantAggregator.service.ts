import { prisma } from '../../server';
import { TrackSmartSuggestService } from './trackSmartSuggest.service';
import { KnowWorkConnectorService } from './knowWorkConnector.service';
import { CodeTrackLinkerService } from './codeTrackLinker.service';
import { RecruiterMatchService } from './recruiterMatch.service';

type AssistantContext = {
  accountId: string;
  projectId?: string;
  issueId?: string;
  jobPostingId?: string;
  candidateId?: string;
  candidateKind?: 'application' | 'recruitment';
};

export class AssistantAggregatorService {
  private trackSmart = new TrackSmartSuggestService();
  private knowWork = new KnowWorkConnectorService();
  private codeTrack = new CodeTrackLinkerService();
  private recruiterMatch = new RecruiterMatchService();

  /**
   * High-level suggestions for the JOB home/assistant surface.
   * Combines next task, at-risk issues, docs, code links and candidate/job signals.
   */
  async getSuggestions(ctx: AssistantContext) {
    const { accountId, projectId, issueId, jobPostingId, candidateId, candidateKind } =
      ctx;

    const suggestions: Record<string, unknown> = {};

    if (projectId) {
      const [nextTask, atRisk, retroDraft] = await Promise.all([
        this.trackSmart.predictNextTask(accountId, projectId),
        this.trackSmart.flagAtRiskIssues(projectId),
        this.knowWork.generateRetroDraft(projectId, 14),
      ]);

      suggestions.project = {
        projectId,
        nextTask,
        atRiskIssues: atRisk,
        retroDraftSummary: retroDraft.draft,
      };
    }

    if (issueId) {
      const [docs, relatedIssues] = await Promise.all([
        this.knowWork.autoLinkDocsToIssue(issueId),
        this.trackSmart.suggestRelatedIssues(projectId || '', issueId),
      ]);

      suggestions.issue = {
        issueId,
        recommendedDocs: docs,
        relatedIssues,
      };
    }

    if (jobPostingId) {
      const [ranked, stats] = await Promise.all([
        this.recruiterMatch.rankCandidatesForJob(jobPostingId, 20),
        this.recruiterMatch.getHiringSuccessStats(jobPostingId),
      ]);
      suggestions.job = {
        jobPostingId,
        topCandidates: ranked.slice(0, 5),
        hiringStats: stats,
      };
    }

    if (candidateId && candidateKind) {
      const jobs = await this.recruiterMatch.suggestJobsForCandidate(
        candidateKind,
        candidateId,
      );
      suggestions.candidate = {
        candidateId,
        kind: candidateKind,
        suggestedJobs: jobs,
      };
    }

    // Basic "today" view: recently active projects/issues/jobs for this account.
    const todayProjects = await prisma.trackProject.findMany({
      where: {
        accountId,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, updatedAt: true },
    });

    const openJobs = await prisma.jobPosting.findMany({
      where: {
        status: 'OPEN',
        OR: [
          { postedById: accountId },
          { recruiterId: accountId },
          { hiringManagerId: accountId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, companyName: true, createdAt: true },
    });

    suggestions.today = {
      projects: todayProjects,
      jobs: openJobs,
    };

    return suggestions;
  }
}

