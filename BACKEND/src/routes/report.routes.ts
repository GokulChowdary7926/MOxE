import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ReportService } from '../services/report.service';
import { prisma } from '../server';

const router = Router();
const service = new ReportService();

/** POST /reports/anonymous – no auth. For anonymous content/account reporting. */
router.post('/anonymous', async (req, res, next) => {
  try {
    const { type, targetId, reason, description } = req.body || {};
    const result = await service.createAnonymous({ type, targetId, reason, description });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    let useAnonymous = req.body?.anonymous === true;
    if (!useAnonymous && req.body?.anonymous == null) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { clientSettings: true },
      });
      const cs = (account?.clientSettings as Record<string, unknown> | null) ?? {};
      useAnonymous = !!cs.anonymousReportingDefault;
    }
    if (useAnonymous) {
      const { type, targetId, reason, description } = req.body || {};
      const result = await service.createAnonymous({ type, targetId, reason, description });
      return res.status(201).json(result);
    }
    const result = await service.create(accountId, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/problem', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { reason, description } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason required' });
    const result = await service.createProblemReport(accountId, reason, description);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
