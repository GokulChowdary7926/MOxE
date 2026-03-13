import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AlertService } from '../services/alert.service';

const router = Router();
const alerts = new AlertService();

router.use(authenticate);

router.get('/schedules', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await alerts.listSchedules(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/schedules', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const schedule = await alerts.createSchedule(accountId, req.body || {});
    res.status(201).json(schedule);
  } catch (e) {
    next(e);
  }
});

router.post('/rules', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const rule = await alerts.createRule(accountId, req.body || {});
    res.status(201).json(rule);
  } catch (e) {
    next(e);
  }
});

router.post('/rules/:ruleId/test', async (req, res, next) => {
  try {
    const result = await alerts.triggerRule(req.params.ruleId, req.body?.payload);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;

