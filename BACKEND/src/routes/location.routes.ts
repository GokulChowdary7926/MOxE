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

/** Search places for post composer / map — real-time geocoding (OpenStreetMap Nominatim via backend). */
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ places: [] });

    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const latRaw = req.query.latitude;
    const lngRaw = req.query.longitude;
    const latitude = latRaw != null && latRaw !== '' ? Number(latRaw) : undefined;
    const longitude = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : undefined;
    const bias =
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
        ? { latitude, longitude }
        : undefined;
    const places = await service.searchPlaces(q, limit, bias);
    res.json({ places });
  } catch (e) {
    next(e);
  }
});

/** Posts tagged with a location string (substring match). */
router.get('/posts', authenticate, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ posts: [] });
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const posts = await service.getPostsByLocationSubstring(q, limit);
    res.json({ posts });
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

router.get('/network', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const scopeRaw = String(req.query.scope || 'followers');
    const scope =
      scopeRaw === 'followers' || scopeRaw === 'following' || scopeRaw === 'friends' || scopeRaw === 'close_friends'
        ? scopeRaw
        : null;
    if (!scope) return res.status(400).json({ error: 'scope must be followers|following|friends|close_friends' });
    const result = await service.getNetworkLocations(accountId, scope);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/network-tags', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const scopeRaw = String(req.query.scope || 'followers');
    const scope =
      scopeRaw === 'followers' || scopeRaw === 'following' || scopeRaw === 'friends' || scopeRaw === 'close_friends'
        ? scopeRaw
        : null;
    if (!scope) return res.status(400).json({ error: 'scope must be followers|following|friends|close_friends' });
    const result = await service.getNetworkTaggedLocations(accountId, scope);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Nearby messaging: record usage (text or media). Text: 10/day, photo: 1/day. */
router.post('/nearby-post', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const kind = req.body?.kind === 'media' ? 'media' : 'text';
    const result = await service.recordNearbyMessaging(accountId, kind);
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

/** Nearby map messaging: sent vs impression counts + daily usage (see `getNearbyAnalyticsSummary`). */
router.get('/nearby-analytics', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const result = await service.getNearbyAnalyticsSummary(accountId, days);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
