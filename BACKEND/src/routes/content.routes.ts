import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ContentService } from '../services/content.service';

const router = Router();
const contentService = new ContentService();

router.post('/screenshot-detected', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await contentService.logScreenshot(accountId, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
