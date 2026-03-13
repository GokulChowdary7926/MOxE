import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics.service';
import { prisma } from '../server';

const router = Router();
const analyticsService = new AnalyticsService();

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
    res.status(201).json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'Invalid event type' || e?.message === 'Account not found') {
      return res.status(400).json({ error: e.message });
    }
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
    if (range === '30d' && account.subscriptionTier !== 'STAR' && account.subscriptionTier !== 'THICK') {
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
    if (range === '30d' && account.subscriptionTier !== 'STAR' && account.subscriptionTier !== 'THICK') {
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
