import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCapability } from '../middleware/requireCapability';
import { TrackService } from '../services/job/track.service';
import { TrackRecruiterService } from '../services/job/track-recruiter.service';
import { TrackAgileService } from '../services/job/track-agile.service';
import { KnowService } from '../services/job/know.service';
import { KnowKnowledgeService } from '../services/job/know-knowledge.service';
import { FlowService } from '../services/job/flow.service';
import { WorkService } from '../services/job/work.service';
import { CodeService } from '../services/job/code.service';
import { StatusService } from '../services/job/status.service';
import { JobVideoService } from '../services/job/video.service';
import { JobAIService } from '../services/job/ai.service';
import { StrategyService } from '../services/job/strategy.service';
import { JobAnalyticsService } from '../services/job/analytics-job.service';
import { JobIntegrationService } from '../services/job/integration.service';
import { JobTeamsService } from '../services/job/teams.service';
import { JobAccessService } from '../services/job/access-job.service';
import { ChatTicketService } from '../services/job/chat-ticket.service';
import { JobDocsService } from '../services/job/docs.service';
import { TrackSmartSuggestService } from '../services/job-algorithms/trackSmartSuggest.service';
import { KnowWorkConnectorService } from '../services/job-algorithms/knowWorkConnector.service';
import { CodeTrackLinkerService } from '../services/job-algorithms/codeTrackLinker.service';
import { RecruiterMatchService } from '../services/job-algorithms/recruiterMatch.service';
import { AssistantAggregatorService } from '../services/job-algorithms/assistantAggregator.service';

const router = Router();
const chatTicketService = new ChatTicketService();
const jobDocsService = new JobDocsService();
const track = new TrackService();
const trackRecruiter = new TrackRecruiterService();
const trackAgile = new TrackAgileService();
const know = new KnowService();
const knowKnowledge = new KnowKnowledgeService();
const flow = new FlowService();
const work = new WorkService();
const codeService = new CodeService();
const statusService = new StatusService();
const jobVideoService = new JobVideoService();
const jobAIService = new JobAIService();
const strategyService = new StrategyService();
const jobAnalyticsService = new JobAnalyticsService();
const jobIntegrationService = new JobIntegrationService();
const jobTeamsService = new JobTeamsService();
const jobAccessService = new JobAccessService();
const trackSmartSuggest = new TrackSmartSuggestService();
const knowWorkConnector = new KnowWorkConnectorService();
const codeTrackLinker = new CodeTrackLinkerService();
const recruiterMatchService = new RecruiterMatchService();
const assistantAggregator = new AssistantAggregatorService();

router.use(authenticate);

// ----- Track (applications & pipelines) - JOB account only -----
router.use('/track', requireCapability('canTrack'));
router.get('/track/applications', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await track.getApplications(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/track/applications/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const app = await track.getApplication(accountId, req.params.id);
    res.json(app);
  } catch (e) {
    next(e);
  }
});

router.post('/track/apply/:jobPostingId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const app = await track.apply(accountId, req.params.jobPostingId, req.body);
    res.status(201).json(app);
  } catch (e) {
    next(e);
  }
});

router.get('/track/pipelines', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await track.getPipelines(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/track/pipelines', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pipeline = await track.createPipeline(
      accountId,
      req.body.name,
      req.body.stageNames
    );
    res.status(201).json(pipeline);
  } catch (e) {
    next(e);
  }
});

router.get('/track/saved-searches', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await track.listSavedJobSearches(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/track/saved-searches', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const saved = await track.createSavedJobSearch(accountId, req.body);
    res.status(201).json(saved);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/saved-searches/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await track.updateSavedJobSearch(accountId, req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/track/saved-searches/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await track.deleteSavedJobSearch(accountId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get('/track/accounts-for-assignment', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await track.getAccountsForAssignment(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** Department hierarchy for setDepartment (spec: top-level + sub-departments). */
const TRACK_DEPARTMENTS = [
  { id: 'engineering', name: 'Engineering', children: [{ id: 'engineering-backend', name: 'Backend' }, { id: 'engineering-frontend', name: 'Frontend' }, { id: 'engineering-devops', name: 'DevOps' }, { id: 'engineering-qa', name: 'QA' }] },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'legal', name: 'Legal' },
  { id: 'consulting', name: 'Consulting' },
  { id: 'hr', name: 'HR' },
  { id: 'finance', name: 'Finance' },
];

router.get('/track/departments', async (_req, res, next) => {
  try {
    res.json(TRACK_DEPARTMENTS);
  } catch (e) {
    next(e);
  }
});

router.get('/track/jobs', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    const myOnly = req.query.myOnly === 'true' || req.query.myOnly === '1';
    const list = await track.getJobPostings(accountId, (req.query.status as string) || 'OPEN', myOnly);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/track/jobs/suggest-titles', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const q = (req.query.q as string) || '';
    const limit = Math.min(parseInt(String(req.query.limit), 10) || 10, 20);
    const titles = await track.suggestJobTitles(accountId, q, limit);
    res.json(titles);
  } catch (e) {
    next(e);
  }
});

// ----- TRACK Smart Suggest (next task, at-risk, related issues) -----
router.get('/track/:projectId/next-task', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const projectId = req.params.projectId;
    const nextTask = await trackSmartSuggest.predictNextTask(accountId, projectId);
    res.json({ nextTask });
  } catch (e) {
    next(e);
  }
});

// ----- KNOW-WORK Connector (docs + retros) -----
router.use('/know', requireCapability('canKnow'));

router.get('/know/connector/issues/:issueId/docs', async (req, res, next) => {
  try {
    const docs = await knowWorkConnector.suggestDocsForIssue(req.params.issueId);
    res.json({ docs });
  } catch (e) {
    next(e);
  }
});

router.post('/know/connector/issues/:issueId/auto-link', async (req, res, next) => {
  try {
    const links = await knowWorkConnector.autoLinkDocsToIssue(req.params.issueId);
    res.json({ links });
  } catch (e) {
    next(e);
  }
});

router.get('/know/connector/projects/:projectId/retro-draft', async (req, res, next) => {
  try {
    const lookbackDays =
      parseInt(String(req.query.lookbackDays || ''), 10) || 14;
    const result = await knowWorkConnector.generateRetroDraft(
      req.params.projectId,
      lookbackDays,
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ----- CODE-TRACK Linker (link code ↔ TRACK issues) -----
router.get('/code/connector/commits/:commitId/issues', async (req, res, next) => {
  try {
    const issues = await codeTrackLinker.predictIssuesForCommit(req.params.commitId);
    res.json({ issues });
  } catch (e) {
    next(e);
  }
});

router.get('/code/connector/repos/:repoId/reviewers', async (req, res, next) => {
  try {
    const filePath = (req.query.filePath as string) || '';
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });
    const reviewers = await codeTrackLinker.suggestReviewersForFile(
      req.params.repoId,
      filePath,
    );
    res.json({ reviewers });
  } catch (e) {
    next(e);
  }
});

router.get('/code/connector/repos/:repoId/file-context', async (req, res, next) => {
  try {
    const filePath = (req.query.filePath as string) || '';
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });
    const context = await codeTrackLinker.getFileContext(req.params.repoId, filePath);
    res.json(context);
  } catch (e) {
    next(e);
  }
});

// ----- RECRUITER-MATCH (rank candidates, suggest jobs, success stats) -----
router.get('/recruiter/jobs/:jobPostingId/candidates', async (req, res, next) => {
  try {
    const jobPostingId = req.params.jobPostingId;
    const ranked = await recruiterMatchService.rankCandidatesForJob(jobPostingId);
    res.json({ candidates: ranked });
  } catch (e) {
    next(e);
  }
});

router.get('/recruiter/candidates/:kind/:candidateId/jobs', async (req, res, next) => {
  try {
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const jobs = await recruiterMatchService.suggestJobsForCandidate(
      kind,
      req.params.candidateId,
    );
    res.json({ jobs });
  } catch (e) {
    next(e);
  }
});

router.get('/recruiter/jobs/:jobPostingId/success-stats', async (req, res, next) => {
  try {
    const stats = await recruiterMatchService.getHiringSuccessStats(
      req.params.jobPostingId,
    );
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

// ----- JOB Assistant: unified suggestions for JOB home -----
router.get('/assistant/suggestions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      projectId,
      issueId,
      jobPostingId,
      candidateId,
      candidateKind,
    } = req.query as Record<string, string | undefined>;

    const suggestions = await assistantAggregator.getSuggestions({
      accountId,
      projectId,
      issueId,
      jobPostingId,
      candidateId,
      candidateKind:
        candidateKind === 'recruitment' ? 'recruitment' : candidateKind === 'application' ? 'application' : undefined,
    });

    res.json({ suggestions });
  } catch (e) {
    next(e);
  }
});

router.get('/track/:projectId/at-risk', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const issues = await trackSmartSuggest.flagAtRiskIssues(projectId);
    res.json({ issues });
  } catch (e) {
    next(e);
  }
});

router.get('/track/issues/:issueId/related', async (req, res, next) => {
  try {
    const issueId = req.params.issueId;
    const projectId = (req.query.projectId as string) || '';
    const related = await trackSmartSuggest.suggestRelatedIssues(projectId, issueId);
    res.json({ related });
  } catch (e) {
    next(e);
  }
});

router.get('/track/jobs/by-slug/:slug', async (req, res, next) => {
  try {
    const job = await track.getJobPostingBySlug(req.params.slug);
    res.json(job);
  } catch (e) {
    next(e);
  }
});

router.get('/track/jobs/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    const job = await track.getJobPosting(req.params.id, accountId);
    res.json(job);
  } catch (e) {
    next(e);
  }
});

router.post('/track/jobs', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const job = await track.createJobPosting(accountId, req.body);
    res.status(201).json(job);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/jobs/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const job = await track.updateJobPosting(accountId, req.params.id, req.body);
    res.json(job);
  } catch (e) {
    next(e);
  }
});

router.post('/track/jobs/:id/publish', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { destinations, expiresAt } = req.body || {};
    const result = await track.publishJob(accountId, req.params.id, { destinations, expiresAt });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ----- Track Recruiter (candidates, pipeline, interviews, decisions) -----
router.get('/track/jobs/:id/candidates', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const stageId = req.query.stageId as string | undefined;
    const result = await trackRecruiter.listCandidatesByJob(accountId, req.params.id, stageId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/track/candidates/:kind/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const candidate = await trackRecruiter.getCandidate(accountId, kind, req.params.id);
    res.json(candidate);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/candidates/:kind/:id/move', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const { pipelineStageId, status, reason } = req.body || {};
    const candidate = await trackRecruiter.moveCandidate(accountId, kind, req.params.id, { pipelineStageId, status, reason });
    res.json(candidate);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/candidates/:kind/:id/notes', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const notes = req.body.notes ?? '';
    const append = !!req.body.append;
    const noteType = req.body.noteType;
    const candidate = await trackRecruiter.addNotes(accountId, kind, req.params.id, notes, append ? { append: true, noteType } : undefined);
    res.json(candidate);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/candidates/:kind/:id/rate', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const rating = Number(req.body.rating);
    const ratingComment = req.body.ratingComment;
    const candidate = await trackRecruiter.rateCandidate(accountId, kind, req.params.id, rating, ratingComment);
    res.json(candidate);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/candidates/:kind/:id/source', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const candidate = await trackRecruiter.trackSource(accountId, kind, req.params.id, req.body.source ?? '');
    res.json(candidate);
  } catch (e) {
    next(e);
  }
});

router.post('/track/jobs/:id/candidates', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { merge, ...data } = req.body || {};
    const candidate = await trackRecruiter.addCandidate(accountId, req.params.id, data, { merge });
    res.status(201).json(candidate);
  } catch (e) {
    next(e);
  }
});

router.post('/track/jobs/:id/candidates/bulk-move', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await trackRecruiter.bulkMoveCandidates(accountId, req.params.id, req.body || {});
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/track/jobs/:id/candidates/import/template', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const csv = await trackRecruiter.getCandidatesImportTemplate(accountId, req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates-import-template.csv"');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

router.post('/track/jobs/:id/candidates/import', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const csv = typeof req.body.csv === 'string' ? req.body.csv : (req.body.csvText ?? '');
    const result = await trackRecruiter.importCandidates(accountId, req.params.id, csv);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/track/interviews', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const interview = await trackRecruiter.createInterview(accountId, req.body);
    res.status(201).json(interview);
  } catch (e) {
    next(e);
  }
});

router.get('/track/interviews/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const interview = await trackRecruiter.getInterview(accountId, req.params.id);
    res.json(interview);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/interviews/:id/interviewers', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const interviewerIds = Array.isArray(req.body.interviewerIds) ? req.body.interviewerIds : [];
    const interview = await trackRecruiter.selectInterviewers(accountId, req.params.id, interviewerIds);
    res.json(interview);
  } catch (e) {
    next(e);
  }
});

router.post('/track/interviews/:id/feedback', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const feedback = await trackRecruiter.addFeedback(accountId, req.params.id, req.body);
    res.status(201).json(feedback);
  } catch (e) {
    next(e);
  }
});

router.get('/track/interviews/:id/feedback', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await trackRecruiter.getInterviewFeedback(accountId, req.params.id);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/interviews/:id/complete', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const interview = await trackRecruiter.completeInterview(accountId, req.params.id);
    res.json(interview);
  } catch (e) {
    next(e);
  }
});

router.post('/track/interviews/:id/send-invites', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await trackRecruiter.sendInterviewInvites(accountId, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/interviews/:id/feedback-form', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const feedbackFormType = req.body?.feedbackFormType || req.body?.formType;
    if (!feedbackFormType) return res.status(400).json({ error: 'feedbackFormType required' });
    const interview = await trackRecruiter.addFeedbackForm(accountId, req.params.id, feedbackFormType);
    res.json(interview);
  } catch (e) {
    next(e);
  }
});

router.post('/track/candidates/:kind/:id/decision', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const candidate = await trackRecruiter.makeDecision(accountId, kind, req.params.id, req.body);
    res.json(candidate);
  } catch (e) {
    next(e);
  }
});

router.post('/track/candidates/:kind/:id/reject', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const result = await trackRecruiter.sendRejection(accountId, kind, req.params.id, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/track/candidates/:kind/:id/email', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const result = await trackRecruiter.sendEmailToCandidate(accountId, kind, req.params.id, req.body || {});
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ----- Track Recruiter – Offer management -----
router.post('/track/candidates/:kind/:id/offer', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const body = req.body || {};
    const offer = await trackRecruiter.createOffer(accountId, kind, req.params.id, {
      title: body.title,
      body: body.body,
      compensationSummary: body.compensationSummary,
      proposedStartDate: body.proposedStartDate ? new Date(body.proposedStartDate) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
    res.status(201).json(offer);
  } catch (e) {
    next(e);
  }
});

router.get('/track/candidates/:kind/:id/offer', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.params.kind === 'recruitment' ? 'recruitment' : 'application';
    const offer = await trackRecruiter.getOfferForCandidate(accountId, kind, req.params.id);
    if (!offer) return res.status(404).json({ error: 'No offer found for this candidate' });
    res.json(offer);
  } catch (e) {
    next(e);
  }
});

router.post('/track/offers/:id/send', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const sendEmail = req.body?.sendEmail === true;
    const offer = await trackRecruiter.sendOffer(accountId, req.params.id, { sendEmail });
    res.json(offer);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/offers/:id/outcome', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const outcome = req.body?.outcome;
    if (outcome !== 'ACCEPTED' && outcome !== 'DECLINED') return res.status(400).json({ error: 'outcome must be ACCEPTED or DECLINED' });
    const offer = await trackRecruiter.setOfferOutcome(accountId, req.params.id, outcome);
    res.json(offer);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/pipelines/:id/stages', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const stageNames = Array.isArray(req.body.stageNames) ? req.body.stageNames : [];
    const pipeline = await trackRecruiter.updatePipelineStages(accountId, req.params.id, stageNames);
    res.json(pipeline);
  } catch (e) {
    next(e);
  }
});

// ----- Track Agile (projects, issues, sprints, board) -----
router.get('/track/projects', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await trackAgile.getProjects(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/track/projects', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const project = await trackAgile.createProject(accountId, req.body);
    res.status(201).json(project);
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const project = await trackAgile.getProject(accountId, req.params.projectId);
    res.json(project);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/projects/:projectId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const project = await trackAgile.updateProject(accountId, req.params.projectId, req.body);
    res.json(project);
  } catch (e) {
    next(e);
  }
});

router.delete('/track/projects/:projectId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await trackAgile.deleteProject(accountId, req.params.projectId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId/board/export', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const format = (req.query.format === 'csv' || req.query.format === 'json') ? req.query.format : 'json';
    const filters: any = {};
    if (req.query.assigneeId) filters.assigneeId = String(req.query.assigneeId);
    if (req.query.priority) filters.priority = String(req.query.priority);
    if (req.query.q) filters.q = String(req.query.q);
    if (req.query.labelIds) filters.labelIds = String(req.query.labelIds).split(',').filter(Boolean);
    const result = await trackAgile.exportBoard(accountId, req.params.projectId, format, Object.keys(filters).length ? filters : undefined);
    if (format === 'csv' && (result as any).csv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${(result as any).filename || 'export.csv'}"`);
      return res.send((result as any).csv);
    }
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId/board', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const filters: any = {};
    if (req.query.assigneeId) filters.assigneeId = String(req.query.assigneeId);
    if (req.query.priority) filters.priority = String(req.query.priority);
    if (req.query.q) filters.q = String(req.query.q);
    if (req.query.labelIds) filters.labelIds = String(req.query.labelIds).split(',').filter(Boolean);
    if (req.query.sprintId) filters.sprintId = String(req.query.sprintId);
    const board = await trackAgile.getBoard(accountId, req.params.projectId, Object.keys(filters).length ? filters : undefined);
    res.json(board);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/columns/:columnId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const column = await trackAgile.updateBoardColumn(accountId, req.params.columnId, req.body);
    res.json(column);
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId/backlog', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const filters: any = {};
    if (req.query.assigneeId) filters.assigneeId = String(req.query.assigneeId);
    if (req.query.priority) filters.priority = String(req.query.priority);
    if (req.query.q) filters.q = String(req.query.q);
    if (req.query.labelIds) filters.labelIds = String(req.query.labelIds).split(',').filter(Boolean);
    const backlog = await trackAgile.getBacklog(accountId, req.params.projectId, Object.keys(filters).length ? filters : undefined);
    res.json(backlog);
  } catch (e) {
    next(e);
  }
});

router.post('/track/projects/:projectId/issues', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.createIssue(accountId, req.params.projectId, req.body);
    res.status(201).json(issue);
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId/capacity', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const capacity = await trackAgile.calculateCapacity(accountId, req.params.projectId, req.query.sprintId as string);
    res.json(capacity);
  } catch (e) {
    next(e);
  }
});

router.post('/track/projects/:projectId/issues/reorder', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const backlog = await trackAgile.reorderBacklog(accountId, req.params.projectId, req.body.issueIds || []);
    res.json(backlog);
  } catch (e) {
    next(e);
  }
});

router.post('/track/projects/:projectId/issues/archive', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const backlog = await trackAgile.archiveIssues(accountId, req.params.projectId, req.body.issueIds || []);
    res.json(backlog);
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId/issues/archived', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await trackAgile.getArchivedIssues(accountId, req.params.projectId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/issues/:issueId/unarchive', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.unarchiveIssue(accountId, req.params.issueId);
    res.json(issue);
  } catch (e) {
    next(e);
  }
});

router.post('/track/issues/:issueId/split', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const created = await trackAgile.splitIssue(accountId, req.params.issueId, req.body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/projects/:projectId/issues/bulk', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await trackAgile.bulkUpdateIssues(accountId, req.params.projectId, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/track/projects/:projectId/issues/import', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const csv = typeof req.body.csv === 'string' ? req.body.csv : (req.body.csvText || '');
    const result = await trackAgile.importIssuesFromCsv(accountId, req.params.projectId, csv);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const labels = await trackAgile.getLabels(accountId, req.params.projectId);
    res.json(labels);
  } catch (e) {
    next(e);
  }
});

router.post('/track/projects/:projectId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const label = await trackAgile.createLabel(accountId, req.params.projectId, req.body);
    res.status(201).json(label);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/labels/:labelId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const label = await trackAgile.updateLabel(accountId, req.params.labelId, req.body);
    res.json(label);
  } catch (e) {
    next(e);
  }
});

router.delete('/track/labels/:labelId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await trackAgile.deleteLabel(accountId, req.params.labelId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/track/issues/:issueId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.addLabelToIssue(accountId, req.params.issueId, req.body.labelId);
    res.json(issue);
  } catch (e) {
    next(e);
  }
});

router.delete('/track/issues/:issueId/labels/:labelId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.removeLabelFromIssue(accountId, req.params.issueId, req.params.labelId);
    res.json(issue);
  } catch (e) {
    next(e);
  }
});

router.post('/track/issues/:issueId/attachments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const att = await trackAgile.addAttachment(accountId, req.params.issueId, req.body);
    res.status(201).json(att);
  } catch (e) {
    next(e);
  }
});

router.delete('/track/attachments/:attachmentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await trackAgile.deleteAttachment(accountId, req.params.attachmentId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/track/projects/:projectId/sprints', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const sprints = await trackAgile.getSprints(accountId, req.params.projectId);
    res.json(sprints);
  } catch (e) {
    next(e);
  }
});

router.post('/track/projects/:projectId/sprints', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const sprint = await trackAgile.createSprint(accountId, req.params.projectId, req.body);
    res.status(201).json(sprint);
  } catch (e) {
    next(e);
  }
});

router.get('/track/issues/:issueId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.getIssue(accountId, req.params.issueId);
    res.json(issue);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/issues/:issueId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.updateIssue(accountId, req.params.issueId, req.body);
    res.json(issue);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/issues/:issueId/move', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.moveIssue(
      accountId,
      req.params.issueId,
      req.body.targetColumnId,
      req.body.rank
    );
    res.json(issue);
  } catch (e) {
    next(e);
  }
});

router.delete('/track/issues/:issueId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await trackAgile.deleteIssue(accountId, req.params.issueId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/track/sprints/:sprintId/start', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const sprint = await trackAgile.startSprint(accountId, req.params.sprintId);
    res.json(sprint);
  } catch (e) {
    next(e);
  }
});

router.patch('/track/sprints/:sprintId/complete', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const sprint = await trackAgile.completeSprint(accountId, req.params.sprintId);
    res.json(sprint);
  } catch (e) {
    next(e);
  }
});

router.post('/track/issues/:issueId/sprint', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const issue = await trackAgile.addIssueToSprint(accountId, req.params.issueId, req.body.sprintId);
    res.json(issue);
  } catch (e) {
    next(e);
  }
});

// ----- Know (companies, reviews, salary, resources) - JOB account only -----
router.use('/know', requireCapability('canKnow'));
router.get('/know/companies', async (req, res, next) => {
  try {
    const list = await know.getCompanies(req.query.search as string);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/know/companies/:slug', async (req, res, next) => {
  try {
    const company = await know.getCompanyBySlug(req.params.slug);
    res.json(company);
  } catch (e) {
    next(e);
  }
});

router.post('/know/companies', async (req, res, next) => {
  try {
    const company = await know.createCompany(req.body);
    res.status(201).json(company);
  } catch (e) {
    next(e);
  }
});

router.post('/know/companies/:companyId/reviews', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const review = await know.addReview(accountId, req.params.companyId, req.body);
    res.json(review);
  } catch (e) {
    next(e);
  }
});

router.post('/know/companies/:companyId/salaries', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const entry = await know.addSalary(accountId, req.params.companyId, req.body);
    res.status(201).json(entry);
  } catch (e) {
    next(e);
  }
});

router.get('/know/resources', async (req, res, next) => {
  try {
    const list = await know.getCareerResources(req.query.companyId as string);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/know/interview-preps', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await know.getInterviewPreps(accountId, req.query.companyId as string);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/know/interview-preps', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const prep = await know.createInterviewPrep(accountId, req.body);
    res.status(201).json(prep);
  } catch (e) {
    next(e);
  }
});

router.post('/know/career-resources', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const resource = await know.createCareerResource(accountId, req.body);
    res.status(201).json(resource);
  } catch (e) {
    next(e);
  }
});

// ----- Know Knowledge Base (spaces, pages, search) -----
router.get('/know/spaces', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await knowKnowledge.listSpaces(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/know/spaces/:spaceIdOrSlug', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const space = await knowKnowledge.getSpace(accountId, req.params.spaceIdOrSlug);
    res.json(space);
  } catch (e) {
    next(e);
  }
});

router.post('/know/spaces', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const space = await knowKnowledge.createSpace(accountId, req.body);
    res.status(201).json(space);
  } catch (e) {
    next(e);
  }
});

router.patch('/know/spaces/:spaceId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const space = await knowKnowledge.updateSpace(accountId, req.params.spaceId, req.body);
    res.json(space);
  } catch (e) {
    next(e);
  }
});

router.delete('/know/spaces/:spaceId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await knowKnowledge.deleteSpace(accountId, req.params.spaceId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/know/spaces/:spaceId/permissions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const space = await knowKnowledge.setSpacePermissions(accountId, req.params.spaceId, req.body.permissions || []);
    res.json(space);
  } catch (e) {
    next(e);
  }
});

router.get('/know/spaces/:spaceId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const labels = await knowKnowledge.getLabels(accountId, req.params.spaceId);
    res.json(labels);
  } catch (e) {
    next(e);
  }
});

router.post('/know/spaces/:spaceId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const label = await knowKnowledge.createLabel(accountId, req.params.spaceId, req.body);
    res.status(201).json(label);
  } catch (e) {
    next(e);
  }
});

router.get('/know/spaces/:spaceId/pages', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const parentId = req.query.parentId as string | undefined;
    const status = req.query.status as string | undefined;
    const list = await knowKnowledge.listPages(accountId, req.params.spaceId, {
      parentId: parentId === '' || parentId === 'null' ? null : parentId,
      status: status || undefined,
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/know/spaces/:spaceId/pages', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const page = await knowKnowledge.createPage(accountId, req.params.spaceId, req.body);
    res.status(201).json(page);
  } catch (e) {
    next(e);
  }
});

router.get('/know/pages/:pageIdOrSlug', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const spaceId = req.query.spaceId as string | undefined;
    const page = await knowKnowledge.getPage(accountId, req.params.pageIdOrSlug, spaceId);
    res.json(page);
  } catch (e) {
    next(e);
  }
});

router.patch('/know/pages/:pageId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const page = await knowKnowledge.updatePage(accountId, req.params.pageId, req.body);
    res.json(page);
  } catch (e) {
    next(e);
  }
});

router.delete('/know/pages/:pageId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await knowKnowledge.deletePage(accountId, req.params.pageId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/know/pages/:pageId/publish', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const page = await knowKnowledge.publishPage(accountId, req.params.pageId);
    res.json(page);
  } catch (e) {
    next(e);
  }
});

router.get('/know/pages/:pageId/versions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await knowKnowledge.getVersionHistory(accountId, req.params.pageId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/know/pages/:pageId/versions/:versionNumber', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const v = await knowKnowledge.getVersion(accountId, req.params.pageId, parseInt(req.params.versionNumber, 10));
    res.json(v);
  } catch (e) {
    next(e);
  }
});

router.post('/know/pages/:pageId/versions/:versionNumber/restore', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const page = await knowKnowledge.restoreVersion(accountId, req.params.pageId, parseInt(req.params.versionNumber, 10));
    res.json(page);
  } catch (e) {
    next(e);
  }
});

router.get('/know/pages/:pageId/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await knowKnowledge.getComments(accountId, req.params.pageId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/know/pages/:pageId/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await knowKnowledge.addComment(accountId, req.params.pageId, req.body);
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

router.post('/know/pages/:pageId/attachments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const att = await knowKnowledge.addAttachment(accountId, req.params.pageId, req.body);
    res.status(201).json(att);
  } catch (e) {
    next(e);
  }
});

router.delete('/know/attachments/:attachmentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await knowKnowledge.deleteAttachment(accountId, req.params.attachmentId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/know/pages/:pageId/restrictions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await knowKnowledge.getPageRestrictions(accountId, req.params.pageId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/know/pages/:pageId/restrictions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await knowKnowledge.setPageRestrictions(accountId, req.params.pageId, req.body.permissions || []);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/know/search/filters', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await knowKnowledge.getSearchFilters(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/know/search', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const q = req.query.q as string | undefined;
    const spaceId = req.query.spaceId as string | undefined;
    const labelIds = req.query.labelIds ? String(req.query.labelIds).split(',').filter(Boolean) : undefined;
    const authorId = req.query.authorId as string | undefined;
    const recentlyUpdated = req.query.recentlyUpdated === 'true' || req.query.recentlyUpdated === '1';
    const popular = req.query.popular === 'true' || req.query.popular === '1';
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const result = await knowKnowledge.searchKnowledge(accountId, {
      q,
      spaceId,
      labelIds,
      authorId,
      recentlyUpdated,
      popular,
      limit,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/know/recent', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const spaceId = req.query.spaceId as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const list = await knowKnowledge.recentlyUpdated(accountId, spaceId, limit);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/know/popular', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const spaceId = req.query.spaceId as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const list = await knowKnowledge.popularPages(accountId, spaceId, limit);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// ----- CODE (repositories, pull requests, code review) - JOB account only -----
router.get('/code/repos', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await codeService.listRepos(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/code/templates/gitignore', async (_req, res, next) => {
  try {
    const list = await codeService.getGitignoreTemplates();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/code/templates/license', async (_req, res, next) => {
  try {
    const list = await codeService.getLicenseTemplates();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const repo = await codeService.createRepo(accountId, req.body);
    res.status(201).json(repo);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoIdOrOwnerSlug', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const repo = await codeService.getRepo(accountId, req.params.repoIdOrOwnerSlug);
    res.json(repo);
  } catch (e) {
    next(e);
  }
});

router.patch('/code/repos/:repoId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const repo = await codeService.updateRepo(accountId, req.params.repoId, req.body);
    res.json(repo);
  } catch (e) {
    next(e);
  }
});

router.delete('/code/repos/:repoId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await codeService.deleteRepo(accountId, req.params.repoId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/branches', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await codeService.listBranches(accountId, req.params.repoId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/branches', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const branch = await codeService.createBranch(accountId, req.params.repoId, req.body.name, req.body.fromBranch);
    res.status(201).json(branch);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/commits', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await codeService.listCommits(accountId, req.params.repoId, req.query.branch as string, req.query.limit ? parseInt(String(req.query.limit), 10) : undefined);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/commits/:commitId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const commit = await codeService.getCommit(accountId, req.params.repoId, req.params.commitId);
    res.json(commit);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/files/:branchName/*', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const branchName = req.params.branchName;
    const filePath = (((req as any).params[0] as string) || '').replace(/^\//, '') || 'README.md';
    const file = await codeService.getFileContent(accountId, req.params.repoId, branchName, filePath);
    res.json(file);
  } catch (e) {
    next(e);
  }
});

router.get('/code/search', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { q, repoId, path, limit } = req.query;
    const results = await codeService.searchCode(accountId, {
      query: String(q || '').trim(),
      repoId: repoId ? String(repoId) : undefined,
      pathContains: path ? String(path) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
    });
    res.json(results);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/commits', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const commit = await codeService.createCommit(accountId, req.params.repoId, req.body.branchName || 'main', req.body);
    res.status(201).json(commit);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await codeService.listRepoLabels(accountId, req.params.repoId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const label = await codeService.createRepoLabel(accountId, req.params.repoId, req.body);
    res.status(201).json(label);
  } catch (e) {
    next(e);
  }
});

router.get('/ai/history', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const history = await jobAIService.history(accountId, limit);
    res.json(history);
  } catch (e) {
    next(e);
  }
});

router.post('/ai/chat', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await jobAIService.chat(accountId, {
      prompt: req.body.prompt,
      model: req.body.model,
      metadata: req.body.metadata,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ----- Strategy (Job strategic plans) -----

router.get('/strategy/plans', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await strategyService.listPlans(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/strategy/plans/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const plan = await strategyService.getPlan(accountId, req.params.id);
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

router.post('/strategy/plans', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const created = await strategyService.createPlan(accountId, req.body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.patch('/strategy/plans/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await strategyService.updatePlan(accountId, req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/strategy/plans/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await strategyService.deletePlan(accountId, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ----- Analytics (Job insights) -----

router.get('/analytics/insights', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const rangeParam = (req.query.range as string) || '7d';
    const range: '7d' | '30d' = rangeParam === '30d' ? '30d' : '7d';
    const payload = await jobAnalyticsService.getJobInsights(accountId, range);
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

// ----- Integrations (Job app integrations) -----

router.get('/integrations', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await jobIntegrationService.list(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/integrations/:provider/connect', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const provider = req.params.provider;
    const connected = await jobIntegrationService.connect(accountId, provider, req.body?.config);
    res.json(connected);
  } catch (e) {
    next(e);
  }
});

router.post('/integrations/:provider/disconnect', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const provider = req.params.provider;
    const result = await jobIntegrationService.disconnect(accountId, provider);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ----- Teams (Job account teams) -----

router.get('/teams', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await jobTeamsService.listMembers(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/teams/invite', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const currentAccountId = (req as any).user?.accountId || (req as any).user?.userId;
    const { memberAccountId, role } = req.body;
    const member = await jobTeamsService.addMember(accountId, currentAccountId, {
      memberAccountId,
      role,
    });
    res.status(201).json(member);
  } catch (e) {
    next(e);
  }
});

router.patch('/teams/:memberId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { role } = req.body;
    const updated = await jobTeamsService.updateMemberRole(accountId, req.params.memberId, role);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/teams/:memberId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await jobTeamsService.removeMember(accountId, req.params.memberId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ----- Access (resolve org for Job account) -----

router.get('/access/org', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const org = await jobAccessService.getOrCreateOrgForAccount(accountId);
    res.json({ id: org.id, name: org.name });
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/collaborators', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: targetAccountId, role } = req.body ?? {};
    if (!targetAccountId) return res.status(400).json({ error: 'accountId required' });
    const repo = await codeService.addCollaborator(accountId, req.params.repoId, targetAccountId, role || 'READ');
    res.json(repo);
  } catch (e) {
    next(e);
  }
});

router.delete('/code/repos/:repoId/collaborators/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const repo = await codeService.removeCollaborator(accountId, req.params.repoId, req.params.accountId);
    res.json(repo);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/pulls', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await codeService.listPullRequests(accountId, req.params.repoId, req.query.status as string);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.createPullRequest(accountId, req.params.repoId, req.body);
    res.status(201).json(pr);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/pulls/:prNumber', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.getPullRequest(accountId, req.params.repoId, parseInt(req.params.prNumber, 10));
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.patch('/code/repos/:repoId/pulls/:prNumber', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.updatePullRequest(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.body);
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls/:prNumber/merge', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.mergePullRequest(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.body?.method || 'merge');
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls/:prNumber/close', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.closePullRequest(accountId, req.params.repoId, parseInt(req.params.prNumber, 10));
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/pulls/:prNumber/diff', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const diff = await codeService.getDiff(accountId, req.params.repoId, parseInt(req.params.prNumber, 10));
    res.json(diff);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls/:prNumber/reviewers', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.addPRReviewer(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.body.accountId);
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls/:prNumber/review', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.setReviewStatus(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.body.status);
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.get('/code/repos/:repoId/pulls/:prNumber/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await codeService.listPRComments(accountId, req.params.repoId, parseInt(req.params.prNumber, 10));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls/:prNumber/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await codeService.addPRComment(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.body);
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls/:prNumber/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.addPRLabel(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.body.labelId);
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.delete('/code/repos/:repoId/pulls/:prNumber/labels/:labelId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.removePRLabel(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.params.labelId);
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

router.post('/code/repos/:repoId/pulls/:prNumber/issues', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const pr = await codeService.linkPRIssue(accountId, req.params.repoId, parseInt(req.params.prNumber, 10), req.body.issueRef);
    res.json(pr);
  } catch (e) {
    next(e);
  }
});

// ----- STATUS (status pages, incidents) - JOB -----
router.get('/status/pages', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await statusService.listPages(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/status/pages', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const page = await statusService.createPage(accountId, req.body);
    res.status(201).json(page);
  } catch (e) {
    next(e);
  }
});

router.get('/status/pages/:pageIdOrSlug', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const page = await statusService.getPage(accountId, req.params.pageIdOrSlug);
    res.json(page);
  } catch (e) {
    next(e);
  }
});

router.patch('/status/pages/:pageId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const page = await statusService.updatePage(accountId, req.params.pageId, req.body);
    res.json(page);
  } catch (e) {
    next(e);
  }
});

router.delete('/status/pages/:pageId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await statusService.deletePage(accountId, req.params.pageId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/status/pages/:pageId/components', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comp = await statusService.addComponent(accountId, req.params.pageId, req.body);
    res.status(201).json(comp);
  } catch (e) {
    next(e);
  }
});

router.patch('/status/pages/:pageId/components/:componentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comp = await statusService.updateComponent(accountId, req.params.pageId, req.params.componentId, req.body);
    res.json(comp);
  } catch (e) {
    next(e);
  }
});

router.delete('/status/pages/:pageId/components/:componentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await statusService.deleteComponent(accountId, req.params.pageId, req.params.componentId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/status/pages/:pageId/incidents', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await statusService.listIncidents(accountId, req.params.pageId, req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/status/pages/:pageId/incidents', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const incident = await statusService.createIncident(accountId, req.params.pageId, req.body);
    res.status(201).json(incident);
  } catch (e) {
    next(e);
  }
});

router.get('/status/pages/:pageId/incidents/:incidentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const incident = await statusService.getIncident(accountId, req.params.pageId, req.params.incidentId);
    res.json(incident);
  } catch (e) {
    next(e);
  }
});

router.patch('/status/pages/:pageId/incidents/:incidentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const incident = await statusService.updateIncident(accountId, req.params.pageId, req.params.incidentId, req.body);
    res.json(incident);
  } catch (e) {
    next(e);
  }
});

router.post('/status/pages/:pageId/incidents/:incidentId/updates', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const update = await statusService.addIncidentUpdate(accountId, req.params.pageId, req.params.incidentId, req.body);
    res.status(201).json(update);
  } catch (e) {
    next(e);
  }
});

router.post('/status/pages/:pageId/incidents/:incidentId/resolve', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const incident = await statusService.resolveIncident(accountId, req.params.pageId, req.params.incidentId, req.body?.resolutionSummary);
    res.json(incident);
  } catch (e) {
    next(e);
  }
});

// ----- Flow (boards, columns, cards) - JOB account only -----
router.use('/flow', requireCapability('canFlow'));
router.get('/flow/boards', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await flow.getBoards(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/boards', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const board = await flow.createBoard(accountId, req.body || {});
    res.status(201).json(board);
  } catch (e) {
    next(e);
  }
});

router.get('/flow/boards/:boardId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const includeArchived = req.query.includeArchived === 'true';
    const board = await flow.getBoard(accountId, req.params.boardId, includeArchived);
    res.json(board);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/boards/:boardId/columns', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const col = await flow.addColumn(accountId, req.params.boardId, req.body.name);
    res.status(201).json(col);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/columns/:columnId/cards', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const card = await flow.addCard(accountId, req.params.columnId, req.body);
    res.status(201).json(card);
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/cards/:cardId/move', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const card = await flow.moveCard(
      accountId,
      req.params.cardId,
      req.body.targetColumnId,
      req.body.order ?? 0
    );
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/cards/:cardId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const card = await flow.updateCard(accountId, req.params.cardId, req.body);
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/cards/:cardId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteCard(accountId, req.params.cardId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/boards/:boardId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const board = await flow.updateBoard(accountId, req.params.boardId, req.body);
    res.json(board);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/boards/:boardId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteBoard(accountId, req.params.boardId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/columns/:columnId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const col = await flow.updateColumn(accountId, req.params.columnId, req.body || {});
    res.json(col);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/columns/:columnId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteColumn(accountId, req.params.columnId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/boards/:boardId/columns/reorder', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const board = await flow.reorderColumns(accountId, req.params.boardId, req.body?.columnIds || []);
    res.json(board);
  } catch (e) {
    next(e);
  }
});

router.get('/flow/cards/:cardId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const card = await flow.getCard(accountId, req.params.cardId);
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/cards/:cardId/archive', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const card = await flow.archiveCard(accountId, req.params.cardId);
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/cards/:cardId/restore', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const card = await flow.restoreCard(accountId, req.params.cardId, req.body?.columnId);
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/boards/:boardId/labels', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const label = await flow.createLabel(
      accountId,
      req.params.boardId,
      req.body?.name ?? '',
      req.body?.color ?? 'blue'
    );
    res.status(201).json(label);
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/labels/:labelId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const label = await flow.updateLabel(accountId, req.params.labelId, req.body || {});
    res.json(label);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/labels/:labelId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteLabel(accountId, req.params.labelId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/flow/cards/:cardId/checklists', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const checklist = await flow.addChecklist(accountId, req.params.cardId, req.body || {});
    res.status(201).json(checklist);
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/checklists/:checklistId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const checklist = await flow.updateChecklist(accountId, req.params.checklistId, req.body || {});
    res.json(checklist);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/checklists/:checklistId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteChecklist(accountId, req.params.checklistId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/flow/checklists/:checklistId/items', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const item = await flow.addChecklistItem(accountId, req.params.checklistId, req.body?.title ?? '');
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/checklist-items/:itemId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const item = await flow.updateChecklistItem(accountId, req.params.itemId, req.body || {});
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/checklist-items/:itemId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteChecklistItem(accountId, req.params.itemId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/flow/cards/:cardId/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await flow.addComment(accountId, req.params.cardId, req.body?.body ?? '');
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

router.get('/flow/cards/:cardId/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comments = await flow.listComments(accountId, req.params.cardId);
    res.json(comments);
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/comments/:commentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await flow.updateComment(accountId, req.params.commentId, req.body?.body ?? '');
    res.json(comment);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/comments/:commentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteComment(accountId, req.params.commentId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/flow/cards/:cardId/attachments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const att = await flow.addAttachment(accountId, req.params.cardId, req.body || {});
    res.status(201).json(att);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/attachments/:attachmentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await flow.deleteAttachment(accountId, req.params.attachmentId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Flow board members (inviteMembers – 7.1.1.5)
router.get('/flow/boards/:boardId/members', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await flow.listMembers(accountId, req.params.boardId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/boards/:boardId/members', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: targetAccountId, role } = req.body || {};
    if (!targetAccountId) return res.status(400).json({ error: 'accountId required' });
    const list = await flow.addMember(accountId, req.params.boardId, targetAccountId, role || 'EDITOR');
    res.status(201).json(list);
  } catch (e) {
    next(e);
  }
});

router.delete('/flow/boards/:boardId/members/:targetAccountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await flow.removeMember(accountId, req.params.boardId, req.params.targetAccountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/flow/boards/:boardId/members/:targetAccountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const role = (req.body || {}).role;
    if (!role) return res.status(400).json({ error: 'role required' });
    const list = await flow.updateMemberRole(accountId, req.params.boardId, req.params.targetAccountId, role);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/flow/boards/:boardId/invite', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { email, role } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' });
    const invite = await flow.inviteByEmail(accountId, req.params.boardId, email.trim(), role || 'EDITOR');
    res.status(201).json(invite);
  } catch (e) {
    next(e);
  }
});

// ----- MOxE WORK – Business Project Planning -----
router.use('/work', requireCapability('canWork'));

router.get('/work/projects', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await work.listProjects(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/work/projects/:idOrSlug', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const project = await work.getProject(accountId, req.params.idOrSlug);
    res.json(project);
  } catch (e) {
    next(e);
  }
});

router.post('/work/projects', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body || {};
    const project = await work.createProject(accountId, {
      name: body.name,
      projectType: body.projectType,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      budgetAmount: body.budgetAmount,
      budgetCurrency: body.budgetCurrency,
      budgetBreakdown: body.budgetBreakdown,
      goals: body.goals,
      memberIds: body.memberIds,
    });
    res.status(201).json(project);
  } catch (e) {
    next(e);
  }
});

router.patch('/work/projects/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body || {};
    const project = await work.updateProject(accountId, req.params.id, {
      name: body.name,
      projectType: body.projectType,
      startDate: body.startDate != null ? new Date(body.startDate) : undefined,
      endDate: body.endDate != null ? new Date(body.endDate) : undefined,
      budgetAmount: body.budgetAmount,
      budgetCurrency: body.budgetCurrency,
      budgetBreakdown: body.budgetBreakdown,
      goals: body.goals,
    });
    res.json(project);
  } catch (e) {
    next(e);
  }
});

router.delete('/work/projects/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await work.deleteProject(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/work/projects/:id/members', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: memberAccountId, role } = req.body ?? {};
    if (!memberAccountId) return res.status(400).json({ error: 'accountId required' });
    const project = await work.addMember(accountId, req.params.id, memberAccountId, role);
    res.json(project);
  } catch (e) {
    next(e);
  }
});

router.delete('/work/projects/:id/members/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await work.removeMember(accountId, req.params.id, req.params.accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/work/projects/:id/gantt', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await work.getProjectGantt(accountId, req.params.id);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/work/task-lists', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await work.createTaskList(accountId, req.body.projectId, req.body.name);
    res.status(201).json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/work/task-lists/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await work.updateTaskList(accountId, req.params.id, req.body);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.delete('/work/task-lists/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await work.deleteTaskList(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/work/tasks', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body || {};
    const task = await work.addTask(accountId, body.taskListId, {
      title: body.title,
      description: body.description,
      assignedToId: body.assignedToId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      priority: body.priority,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      durationDays: body.durationDays,
    });
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

router.get('/work/tasks/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const task = await work.getTask(accountId, req.params.id);
    res.json(task);
  } catch (e) {
    next(e);
  }
});

router.patch('/work/tasks/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body || {};
    const task = await work.updateTask(accountId, req.params.id, {
      title: body.title,
      description: body.description,
      assignedToId: body.assignedToId,
      dueDate: body.dueDate != null ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      priority: body.priority,
      status: body.status,
      progress: body.progress,
      startDate: body.startDate != null ? (body.startDate ? new Date(body.startDate) : null) : undefined,
      durationDays: body.durationDays,
      order: body.order,
    });
    res.json(task);
  } catch (e) {
    next(e);
  }
});

router.post('/work/tasks/:id/complete', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const task = await work.completeTask(accountId, req.params.id);
    res.json(task);
  } catch (e) {
    next(e);
  }
});

router.delete('/work/tasks/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await work.deleteTask(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/work/tasks/:id/checklist', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const item = await work.addChecklistItem(accountId, req.params.id, req.body.text || '');
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch('/work/checklist/:itemId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const item = await work.toggleChecklistItem(accountId, req.params.itemId);
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post('/work/tasks/:id/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await work.addComment(accountId, req.params.id, req.body.body || '');
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

router.post('/work/tasks/:id/attachments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const att = await work.addTaskAttachment(accountId, req.params.id, req.body.fileUrl || '', req.body.fileName);
    res.status(201).json(att);
  } catch (e) {
    next(e);
  }
});

router.delete('/work/attachments/:attachmentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await work.deleteTaskAttachment(accountId, req.params.attachmentId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/work/dependencies', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const dep = await work.setDependency(accountId, req.body.predecessorId, req.body.successorId, req.body.type);
    res.json(dep);
  } catch (e) {
    next(e);
  }
});

router.get('/work/accounts-for-assignment', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const accounts = await work.getAssignmentAccounts(accountId);
    res.json(accounts);
  } catch (e) {
    next(e);
  }
});

// ----- MOxE CHAT – ticketing (convert message to ticket; assignment; status) -----

router.get('/chat/tickets', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const status = req.query.status as string | undefined;
    const assignedToMe = req.query.assignedToMe === 'true';
    const list = await chatTicketService.listTickets(accountId, { status, assignedToMe });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/chat/tickets/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const ticket = await chatTicketService.getTicket(accountId, req.params.id);
    res.json(ticket);
  } catch (e: any) {
    if (e?.message === 'Ticket not found') return res.status(404).json({ error: 'Ticket not found' });
    next(e);
  }
});

router.post('/chat/tickets', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { messageId, peerId, subject, description, priority } = req.body || {};
    const created = await chatTicketService.createTicket(accountId, {
      messageId,
      peerId,
      subject: subject || 'Support request',
      description,
      priority,
    });
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.message?.includes('required')) return res.status(400).json({ error: e.message });
    next(e);
  }
});

router.patch('/chat/tickets/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { status, priority, assignedToAccountId } = req.body || {};
    const updated = await chatTicketService.updateTicket(accountId, req.params.id, {
      status,
      priority,
      assignedToAccountId,
    });
    res.json(updated);
  } catch (e: any) {
    if (e?.message === 'Ticket not found') return res.status(404).json({ error: 'Ticket not found' });
    next(e);
  }
});

router.patch('/chat/tickets/:id/assign', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const assignToAccountId = req.body?.assignedToAccountId ?? req.body?.accountId ?? null;
    const updated = await chatTicketService.assignTicket(accountId, req.params.id, assignToAccountId);
    res.json(updated);
  } catch (e: any) {
    if (e?.message === 'Ticket not found') return res.status(404).json({ error: 'Ticket not found' });
    next(e);
  }
});

router.patch('/chat/tickets/:id/status', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status is required' });
    const updated = await chatTicketService.setStatus(accountId, req.params.id, status);
    res.json(updated);
  } catch (e: any) {
    if (e?.message === 'Ticket not found') return res.status(404).json({ error: 'Ticket not found' });
    if (e?.message === 'Invalid status') return res.status(400).json({ error: e.message });
    next(e);
  }
});

// ----- MOxE DOCS – document editing, version history, comments -----

router.get('/docs', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await jobDocsService.listDocuments(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/docs/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const doc = await jobDocsService.getDocument(accountId, req.params.id);
    res.json(doc);
  } catch (e: any) {
    if (e?.message === 'Document not found') return res.status(404).json({ error: 'Document not found' });
    next(e);
  }
});

router.post('/docs', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, content } = req.body || {};
    const created = await jobDocsService.createDocument(accountId, { title: title || 'Untitled', content });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.patch('/docs/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, content } = req.body || {};
    const updated = await jobDocsService.updateDocument(accountId, req.params.id, { title, content });
    res.json(updated);
  } catch (e: any) {
    if (e?.message === 'Document not found') return res.status(404).json({ error: 'Document not found' });
    next(e);
  }
});

router.delete('/docs/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await jobDocsService.deleteDocument(accountId, req.params.id);
    res.status(204).send();
  } catch (e: any) {
    if (e?.message === 'Document not found') return res.status(404).json({ error: 'Document not found' });
    next(e);
  }
});

router.get('/docs/:id/versions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const versions = await jobDocsService.listVersions(accountId, req.params.id);
    res.json(versions);
  } catch (e: any) {
    if (e?.message === 'Document not found') return res.status(404).json({ error: 'Document not found' });
    next(e);
  }
});

router.post('/docs/:id/comments', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { content, parentId } = req.body || {};
    const comment = await jobDocsService.addComment(accountId, req.params.id, { content: content || '', parentId });
    res.status(201).json(comment);
  } catch (e: any) {
    if (e?.message === 'Document not found') return res.status(404).json({ error: 'Document not found' });
    next(e);
  }
});

router.patch('/docs/:id/comments/:commentId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const resolved = req.body?.resolved !== false;
    const updated = await jobDocsService.resolveComment(accountId, req.params.id, req.params.commentId, resolved);
    res.json(updated);
  } catch (e: any) {
    if (e?.message === 'Document not found' || e?.message === 'Comment not found') {
      return res.status(404).json({ error: e.message });
    }
    next(e);
  }
});

// ----- MOxE VIDEO – screen recordings for Job accounts -----

router.get('/video', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await jobVideoService.listVideos(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/video/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const video = await jobVideoService.getVideo(accountId, req.params.id);
    res.json(video);
  } catch (e: any) {
    if (e?.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    next(e);
  }
});

router.post('/video', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, description, url, fileSize, durationSeconds, visibility } = req.body || {};
    const created = await jobVideoService.createVideo(accountId, {
      title,
      description,
      url,
      fileSize: Number(fileSize),
      durationSeconds: durationSeconds != null ? Number(durationSeconds) : undefined,
      visibility,
    });
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.message?.startsWith('Title is required') || e?.message?.startsWith('Video URL is required') || e?.message?.includes('fileSize')) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

export default router;
