import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { BuildService } from '../services/job/build.service';

const router = Router();
const buildService = new BuildService();

router.use(authenticate as any);
router.use((req: any, _res, next) => {
  req.account = req.account || (req.user?.accountId ? { id: req.user.accountId } : null);
  next();
});

// List pipelines for current JOB account
router.get('/pipelines', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const pipelines = await buildService.listPipelines(accountId);
    res.json(pipelines);
  } catch (err) {
    next(err);
  }
});

// Create pipeline
router.post('/pipelines', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { repoId, name, branchFilter, triggers, stages, externalKey } = req.body || {};
    const pipeline = await buildService.createPipeline(accountId, {
      repoId,
      name,
      branchFilter,
      triggers,
      stages,
      externalKey,
    });
    res.status(201).json(pipeline);
  } catch (err) {
    next(err);
  }
});

// Get pipeline detail + recent runs
router.get('/pipelines/:pipelineId', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { pipelineId } = req.params;
    const pipeline = await buildService.getPipeline(accountId, pipelineId);
    const runs = await buildService.listRuns(accountId, pipelineId);
    res.json({ pipeline, runs });
  } catch (err) {
    next(err);
  }
});

// List runs only
router.get('/pipelines/:pipelineId/runs', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { pipelineId } = req.params;
    const runs = await buildService.listRuns(accountId, pipelineId);
    res.json(runs);
  } catch (err) {
    next(err);
  }
});

// Webhook endpoint for external CI to push build status
router.post('/webhook', async (req, res, next) => {
  try {
    // Optional: restrict callers via env: compare req.headers['x-moxe-build-token'] to process.env.MOXE_BUILD_WEBHOOK_SECRET

    const run = await buildService.recordRunFromWebhook(req.body || {});
    res.json({ ok: true, runId: run.id });
  } catch (err) {
    next(err);
  }
});

export default router;

