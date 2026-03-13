import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { ReelService } from '../services/reel.service';

const router = Router();
const reelService = new ReelService();

router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    if (accountId) {
      const viewerId = (req as any).user?.accountId ?? null;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 30, 50);
      const result = await reelService.listByAccount(viewerId, accountId, cursor, limit);
      return res.json(result);
    }
    const viewerId = (req as any).user?.accountId ?? null;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await reelService.list(viewerId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const reel = await reelService.create(accountId, req.body);
    res.status(201).json(reel);
  } catch (e) {
    next(e);
  }
});

export default router;
