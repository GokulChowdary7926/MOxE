import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { searchService } from '../services/search.service';

const router = Router();

router.get('/config', (_req, res) => {
  res.json(searchService.getPublicConfig());
});

router.post('/reindex', authenticate, async (req, res, next) => {
  try {
    const user = (req as any).user;
    if (!user?.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    if (!searchService.isEnabled()) {
      return res.status(503).json({ error: 'Search not configured' });
    }
    await searchService.reindexAll();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

