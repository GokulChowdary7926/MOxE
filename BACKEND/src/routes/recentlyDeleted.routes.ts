import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listRecentlyDeleted,
  permanentDelete,
  restore,
  softDelete,
  SoftDeleteModel,
} from '../services/softDelete.service';

const router = Router();

function normalizeModelName(typeRaw: string): SoftDeleteModel | null {
  const type = String(typeRaw || '').trim();
  const map: Record<string, SoftDeleteModel> = {
    post: 'post',
    reel: 'reel',
    story: 'story',
    comment: 'comment',
    note: 'note',
    highlight: 'highlight',
    collection: 'collection',
    anonymousPost: 'anonymousPost',
    anonymous_post: 'anonymousPost',
    live: 'live',
    message: 'message',
  };
  return map[type] ?? null;
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const data = await listRecentlyDeleted(accountId, limit);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/restore/:type/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const model = normalizeModelName(req.params.type);
    if (!model) return res.status(400).json({ error: 'Unsupported model type' });
    await restore(model, req.params.id, accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/permanent/:type/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const model = normalizeModelName(req.params.type);
    if (!model) return res.status(400).json({ error: 'Unsupported model type' });
    await permanentDelete(model, req.params.id, accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/soft-delete/:type/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const model = normalizeModelName(req.params.type);
    if (!model) return res.status(400).json({ error: 'Unsupported model type' });
    await softDelete(model, req.params.id, accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
