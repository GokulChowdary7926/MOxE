import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics.service';
import { ContentAnalyticsService } from '../services/content-analytics.service';
import { prisma } from '../server';
import { isProductionFreeSubscriptionsEnabled } from '../constants/tierCapabilities';

const router = Router();
const analyticsService = new AnalyticsService();
const contentAnalyticsService = new ContentAnalyticsService();

router.get('/', (_req, res) => res.json({ service: 'analytics' }));

/** Record profile_visit, link_click, or action_button_click for a business profile. Public (optional auth). */
router.post('/record-event', optionalAuthenticate, async (req, res, next) => {
  try {
    const { targetAccountId, eventType, metadata } = req.body as { targetAccountId?: string; eventType?: string; metadata?: Record<string, unknown> };
    if (!targetAccountId || !eventType) {
      return res.status(400).json({ error: 'targetAccountId and eventType required' });
    }
    const viewerAccountId = (req as any).user?.accountId as string | undefined;
    const enrichedMetadata = {
      ...(metadata || {}),
      viewerAccountId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    } as Record<string, unknown>;

    await analyticsService.recordEvent(targetAccountId, eventType, enrichedMetadata);
    if (eventType === 'reel_view' && typeof (metadata as any)?.reelId === 'string') {
      const reelId = String((metadata as any).reelId);
      await contentAnalyticsService.trackView(
        reelId,
        'reel',
        targetAccountId,
        typeof (metadata as any)?.source === 'string' ? String((metadata as any).source) : undefined
      );
      if (viewerAccountId) {
        await prisma.reelView
          .upsert({
            where: { accountId_reelId: { accountId: viewerAccountId, reelId } },
            create: { accountId: viewerAccountId, reelId, viewedAt: new Date() },
            update: { viewedAt: new Date() },
          })
          .catch(() => {});
      }
    }
    res.status(201).json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'Invalid event type' || e?.message === 'Account not found') {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

/** Track reel retention sample from client player (creator analytics). */
router.post('/reels/:reelId/retention', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const reelId = req.params.reelId;
    const second = Number(req.body?.second);
    if (!Number.isFinite(second)) {
      return res.status(400).json({ error: 'second is required' });
    }
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
      select: { accountId: true },
    });
    if (!reel) return res.status(404).json({ error: 'Reel not found' });
    await contentAnalyticsService.trackRetention(reelId, reel.accountId, second);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Read retention points for one reel (owner only). */
router.get('/reels/:reelId/retention', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const points = await prisma.reelRetention.findMany({
      where: { reelId: req.params.reelId, ownerId: accountId },
      orderBy: { second: 'asc' },
    });
    res.json({ points });
  } catch (e) {
    next(e);
  }
});

// Strict per-content analytics (owner only)
router.get('/content/:type/:id', authenticate, async (req, res, next) => {
  try {
    const ownerId = (req as any).user?.accountId;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = await contentAnalyticsService.getContentAnalyticsForOwner(
      ownerId,
      req.params.type,
      req.params.id
    );
    if (!payload) return res.status(404).json({ error: 'Content not found or not yours' });
    res.json(payload);
  } catch (e: any) {
    if (e?.message === 'Invalid content type') return res.status(400).json({ error: e.message });
    next(e);
  }
});

// Strict creator aggregation from content_analytics
router.get('/creator', authenticate, async (req, res, next) => {
  try {
    const ownerId = (req as any).user?.accountId;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;
    const payload = await contentAnalyticsService.getCreatorAnalytics(
      ownerId,
      from && !Number.isNaN(from.getTime()) ? from : undefined,
      to && !Number.isNaN(to.getTime()) ? to : undefined
    );
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.get('/reel/:id/retention', authenticate, async (req, res, next) => {
  try {
    const ownerId = (req as any).user?.accountId;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await prisma.reelRetention.findMany({
      where: { reelId: req.params.id, ownerId },
      orderBy: { second: 'asc' },
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/insights', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true, subscriptionTier: true },
    });
    if (!account || (account.accountType !== 'BUSINESS' && account.accountType !== 'CREATOR')) {
      return res.status(403).json({ error: 'Business or Creator account required' });
    }
    const range: '7d' | '30d' = ((req.query.range as string) || '7d') === '30d' ? '30d' : '7d';
    const paidOverride = isProductionFreeSubscriptionsEnabled();
    if (!paidOverride && range === '30d' && account.subscriptionTier !== 'STAR' && account.subscriptionTier !== 'THICK') {
      return res.status(403).json({ error: 'Upgrade to STAR or THICK for 30-day insights' });
    }
    const payload = await analyticsService.getBusinessInsights(accountId, range);
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.get('/insights/export', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true, subscriptionTier: true },
    });
    if (!account || (account.accountType !== 'BUSINESS' && account.accountType !== 'CREATOR')) {
      return res.status(403).json({ error: 'Business or Creator account required' });
    }
    const range: '7d' | '30d' = ((req.query.range as string) || '7d') === '30d' ? '30d' : '7d';
    const paidOverride = isProductionFreeSubscriptionsEnabled();
    if (!paidOverride && range === '30d' && account.subscriptionTier !== 'STAR' && account.subscriptionTier !== 'THICK') {
      return res.status(403).json({ error: 'Upgrade to STAR or THICK for 30-day export' });
    }
    const csv = await analyticsService.exportInsightsCsv(accountId, range);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="business-insights-${range}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

export default router;
