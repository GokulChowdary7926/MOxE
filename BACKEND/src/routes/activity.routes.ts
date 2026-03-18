/**
 * Activity: watch history, etc.
 * GET /activity/watch-history — Reels/posts the user has watched. Returns { items: [] } until implemented.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/watch-history', authenticate, async (req, res, next) => {
  try {
    const _accountId = (req as any).user?.accountId;
    if (!_accountId) return res.status(401).json({ error: 'Unauthorized' });
    // TODO: persist and return watched reels/posts from DB
    res.json({ items: [] });
  } catch (e) {
    next(e);
  }
});

export default router;
