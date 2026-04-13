/**
 * Activity: watch history, screen time, recent searches, link opens.
 * GET /activity/watch-history — Reels/posts the user has watched in the last 30 days (ReelView + View).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  addLinkOpen,
  addRecentSearch,
  clearRecentSearches,
  deleteRecentSearch,
  getTimeSpentSummary,
  getWatchHistory,
  listLinkOpens,
  listRecentSearches,
  recordScreenTimeBeat,
} from '../services/activity.service';

const router = Router();

router.get('/watch-history', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { items } = await getWatchHistory(accountId);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

/** POST body: { seconds: number } — incremental active time since last beat (capped server-side). */
router.post('/screen-time/beat', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const out = await recordScreenTimeBeat(accountId, (req.body as any)?.seconds);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

/** GET ?days=14 — daily seconds + totals for Your Activity > Time spent. */
router.get('/time-spent', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const days = Number(req.query.days) || 14;
    const summary = await getTimeSpentSummary(accountId, days);
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

router.get('/recent-searches', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const out = await listRecentSearches(accountId);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.post('/recent-searches', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = (req.body || {}) as { type?: string; term?: string; refId?: string };
    await addRecentSearch(accountId, {
      type: body.type ?? 'query',
      term: body.term ?? '',
      refId: body.refId,
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/recent-searches', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await clearRecentSearches(accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/recent-searches/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await deleteRecentSearch(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/link-history', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const out = await listLinkOpens(accountId);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.post('/link-history', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { url, title } = (req.body || {}) as { url?: string; title?: string };
    await addLinkOpen(accountId, url ?? '', title);
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
