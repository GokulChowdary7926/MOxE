/**
 * Collection routes: list/create/update/delete collections, list saved posts, share.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { CollectionService } from '../services/collection.service';

const router = Router();
const collectionService = new CollectionService();

router.get('/shared/:shareToken', async (req, res, next) => {
  try {
    const collection = await collectionService.getByShareToken(req.params.shareToken);
    res.json(collection);
  } catch (e) {
    next(e);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await collectionService.list(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { name, coverImage } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name required' });
    const collection = await collectionService.create(accountId, name, coverImage);
    res.status(201).json(collection);
  } catch (e) {
    next(e);
  }
});

router.get('/saved', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const collectionId = req.query.collectionId as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const result = await collectionService.listSaved(
      accountId,
      collectionId === '' ? null : collectionId,
      cursor,
      limit
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/:collectionId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const collection = await collectionService.update(accountId, req.params.collectionId, req.body);
    res.json(collection);
  } catch (e) {
    next(e);
  }
});

router.delete('/:collectionId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await collectionService.delete(accountId, req.params.collectionId);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:collectionId/share', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await collectionService.createShareToken(accountId, req.params.collectionId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
