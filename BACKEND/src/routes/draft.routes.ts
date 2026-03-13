import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { DraftService } from '../services/draft.service';

const router = Router();
const service = new DraftService();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.list(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:draftId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const draft = await service.get(accountId, req.params.draftId);
    res.json(draft);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { type, content, media } = req.body;
    if (!type) return res.status(400).json({ error: 'type required' });
    const draft = await service.create(accountId, type, content ?? {}, media);
    res.status(201).json(draft);
  } catch (e) {
    next(e);
  }
});

router.patch('/:draftId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { content, media } = req.body;
    const draft = await service.update(accountId, req.params.draftId, content, media);
    res.json(draft);
  } catch (e) {
    next(e);
  }
});

router.delete('/:draftId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.delete(accountId, req.params.draftId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
