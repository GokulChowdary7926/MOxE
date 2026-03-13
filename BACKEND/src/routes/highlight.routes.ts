import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { HighlightService } from '../services/highlight.service';

const router = Router();
const highlightService = new HighlightService();

/** Public: view any highlight by id */
router.get('/view/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const h = await highlightService.getByIdPublic(req.params.id);
    res.json(h);
  } catch (e) {
    next(e);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await highlightService.list(accountId);
    res.json({ highlights: list });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const h = await highlightService.getById(accountId, req.params.id);
    res.json(h);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { name?: string; coverImage?: string; archivedStoryIds?: string[] };
    const h = await highlightService.create(accountId, {
      name: body.name || 'Highlight',
      coverImage: body.coverImage,
      archivedStoryIds: body.archivedStoryIds || [],
    });
    res.status(201).json(h);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { name?: string; coverImage?: string };
    const h = await highlightService.update(accountId, req.params.id, body);
    res.json(h);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await highlightService.delete(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/items', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { archivedStoryId } = req.body;
    if (!archivedStoryId) return res.status(400).json({ error: 'archivedStoryId required' });
    const h = await highlightService.addItem(accountId, req.params.id, archivedStoryId);
    res.json(h);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/items/:itemId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await highlightService.removeItem(accountId, req.params.id, req.params.itemId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reorder', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { itemIds } = req.body as { itemIds?: string[] };
    if (!Array.isArray(itemIds)) return res.status(400).json({ error: 'itemIds array required' });
    const h = await highlightService.reorder(accountId, req.params.id, itemIds);
    res.json(h);
  } catch (e) {
    next(e);
  }
});

export default router;
