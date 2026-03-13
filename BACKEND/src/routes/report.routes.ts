import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ReportService } from '../services/report.service';

const router = Router();
const service = new ReportService();

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
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
