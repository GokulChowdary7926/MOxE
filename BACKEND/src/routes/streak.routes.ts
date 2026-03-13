/**
 * Streak routes: check-in, list, types.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { StreakService } from '../services/streak.service';

const router = Router();
const service = new StreakService();

router.use(authenticate);

router.post('/check-in', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { type } = req.body;
    if (!type || typeof type !== 'string') return res.status(400).json({ error: 'type required' });
    const result = await service.checkIn(accountId, type);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.list(accountId);
    res.json({ items: list });
  } catch (e) {
    next(e);
  }
});

router.get('/types', async (_req, res, next) => {
  try {
    const types = service.getTypes();
    res.json({ types });
  } catch (e) {
    next(e);
  }
});

/** 3.6 Share: preview payload for sharing streaks (e.g. to story or copy). */
router.get('/share-preview', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.list(accountId);
    res.json({
      items: list.map((r) => ({ type: r.type, currentCount: r.currentCount, longestCount: r.longestCount, lastCheckIn: r.lastCheckIn })),
      summary: list.length ? `${list.length} streak type(s). Current: ${list.map((s) => `${s.type} ${s.currentCount}`).join(', ')}` : 'No streaks yet.',
    });
  } catch (e) {
    next(e);
  }
});

export default router;
