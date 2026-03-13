import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

const router = Router();
const notificationService = new NotificationService();

/** GET /notifications — Instagram-style activity: { items, nextCursor }. Each item: id, type (like|comment|follow|mention|...), actor: { username, avatarUrl? }, targetPostId?, targetCommentId?, text?, createdAt, read. */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const tab = (req.query.tab as 'all' | 'mentions') || 'all';
    const cursor = req.query.cursor as string | undefined;
    const limit = Number(req.query.limit) || 30;
    const result = await notificationService.list(accountId, tab, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await notificationService.markRead(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await notificationService.markAllRead(accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
