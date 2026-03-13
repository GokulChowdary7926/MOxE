import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { LocationService } from '../services/location.service';

const router = Router();
const service = new LocationService();

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { latitude?: number; longitude?: number; accuracy?: number };
    await service.updateLocation(accountId, {
      latitude: body.latitude!,
      longitude: body.longitude!,
      accuracy: body.accuracy,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Search places for post composer / map location picker. */
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ places: [] });

    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const places = await service.searchPlaces(q, limit);
    res.json({ places });
  } catch (e) {
    next(e);
  }
});

router.get('/preferences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await service.getPreferences(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/preferences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { nearbyEnabled?: boolean };
    const result = await service.setNearbyEnabled(accountId, !!body.nearbyEnabled);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/nearby', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const lat = Number(req.query.latitude);
    const lng = Number(req.query.longitude);
    const radius = req.query.radius != null ? Number(req.query.radius) : undefined;
    const result = await service.getNearby(accountId, lat, lng, radius);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 4.1.1 Nearby messaging: record a post to nearby (1 free/day for paid, then $0.50 each). */
router.post('/nearby-post', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await service.recordNearbyPost(accountId);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/nearby-post/usage', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await service.getNearbyPostUsage(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
