import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ProximityService } from '../services/proximity.service';

const router = Router();
const service = new ProximityService();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.list(accountId);
    res.json({ alerts: list });
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { targetAccountId?: string; radiusMeters?: number; cooldownMinutes?: number };
    if (!body.targetAccountId) return res.status(400).json({ error: 'targetAccountId required' });
    const alert = await service.create(accountId, {
      targetAccountId: body.targetAccountId,
      radiusMeters: body.radiusMeters,
      cooldownMinutes: body.cooldownMinutes,
    });
    res.status(201).json(alert);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { radiusMeters?: number; cooldownMinutes?: number; isActive?: boolean };
    const alert = await service.update(accountId, req.params.id, body);
    res.json(alert);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.delete(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
