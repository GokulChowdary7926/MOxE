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

router.get('/screenshot-logs/mine', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limitRaw = parseInt(String(req.query.limit ?? ''), 10);
    const limit = Number.isNaN(limitRaw) ? undefined : limitRaw;
    const cursorId = typeof req.query.cursorId === 'string' ? req.query.cursorId : undefined;
    const result = await contentService.listScreenshotLogsForOwner(accountId, { limit, cursorId });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/screenshot-alert-preference', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await contentService.getScreenshotAlertPreference(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/screenshot-alert-preference', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await contentService.setScreenshotAlertPreference(accountId, !!req.body?.screenshotAlerts);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
