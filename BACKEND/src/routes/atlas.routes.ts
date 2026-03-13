import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AtlasService } from '../services/job/atlas.service';

const router = Router();
const atlas = new AtlasService();

router.use(authenticate as any);
router.use((req: any, _res, next) => {
  req.account = req.account || (req.user?.accountId ? { id: req.user.accountId } : null);
  next();
});

// List objectives for current JOB account
router.get('/objectives', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const objectives = await atlas.listObjectives(accountId);
    res.json(objectives);
  } catch (err) {
    next(err);
  }
});

// Create objective with key results
router.post('/objectives', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const created = await atlas.createObjective(accountId, req.body || {});
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Get objective detail
router.get('/objectives/:objectiveId', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { objectiveId } = req.params;
    const detail = await atlas.getObjective(accountId, objectiveId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

// Update key result progress
router.post('/key-results/:keyResultId/progress', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { keyResultId } = req.params;
    const { value, note } = req.body || {};
    const result = await atlas.addProgressUpdate(accountId, keyResultId, { value, note });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Update objective state
router.patch('/objectives/:objectiveId/state', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { objectiveId } = req.params;
    const { state } = req.body || {};
    const result = await atlas.setObjectiveState(accountId, objectiveId, state);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Link objective to a TRACK project
router.post('/objectives/:objectiveId/track-project', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { objectiveId } = req.params;
    const { projectId } = req.body || {};
    const result = await atlas.linkObjectiveToProject(accountId, objectiveId, projectId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Unlink objective from TRACK project
router.delete('/objectives/:objectiveId/track-project', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { objectiveId } = req.params;
    const result = await atlas.unlinkObjectiveFromProject(accountId, objectiveId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Link key result to a TRACK issue
router.post('/key-results/:keyResultId/track-issues', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { keyResultId } = req.params;
    const { issueId } = req.body || {};
    const result = await atlas.addKeyResultIssueLink(accountId, keyResultId, issueId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Unlink key result from a TRACK issue
router.delete('/key-results/:keyResultId/track-issues/:issueId', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { keyResultId, issueId } = req.params;
    const result = await atlas.removeKeyResultIssueLink(accountId, keyResultId, issueId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

