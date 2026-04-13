import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AdService } from '../services/ad.service';
import { AdBillingService } from '../services/ad-billing.service';
import { prisma } from '../server';

const router = Router();
const adService = new AdService();
const adBillingService = new AdBillingService();

// Simple health endpoint
router.get('/', authenticate, async (_req, res) => {
  res.json({ service: 'ads' });
});

// List campaigns for current Business/Creator account
router.get('/campaigns', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const status = req.query.status as any | undefined;
    const campaigns = await adService.listCampaigns(accountId, status);
    res.json({ campaigns });
  } catch (e) {
    next(e);
  }
});

// Get single campaign with metrics
router.get('/campaigns/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const campaign = await adService.getCampaign(accountId, req.params.id);
    res.json(campaign);
  } catch (e) {
    next(e);
  }
});

// Create a new campaign (STANDARD or BOOST) with explicit payload
router.post('/campaigns', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const campaign = await adService.createCampaign(accountId, {
      name: req.body?.name,
      objective: req.body?.objective,
      type: req.body?.type,
      dailyBudget: req.body?.dailyBudget,
      totalBudget: req.body?.totalBudget,
      currency: req.body?.currency,
      destinationUrl: req.body?.destinationUrl,
      utmSource: req.body?.utmSource,
      utmMedium: req.body?.utmMedium,
      utmCampaign: req.body?.utmCampaign,
      utmTerm: req.body?.utmTerm,
      utmContent: req.body?.utmContent,
      startDate: req.body?.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body?.endDate ? new Date(req.body.endDate) : undefined,
      postId: req.body?.postId,
    });
    res.status(201).json(campaign);
  } catch (e) {
    next(e);
  }
});

// Update an existing campaign (name, status, budgets, dates)
router.patch('/campaigns/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const campaign = await adService.updateCampaign(accountId, req.params.id, {
      name: req.body?.name,
      objective: req.body?.objective,
      status: req.body?.status,
      dailyBudget: req.body?.dailyBudget,
      totalBudget: req.body?.totalBudget,
      currency: req.body?.currency,
      destinationUrl: req.body?.destinationUrl,
      utmSource: req.body?.utmSource,
      utmMedium: req.body?.utmMedium,
      utmCampaign: req.body?.utmCampaign,
      utmTerm: req.body?.utmTerm,
      utmContent: req.body?.utmContent,
      startDate: req.body?.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body?.endDate ? new Date(req.body.endDate) : undefined,
    });
    res.json(campaign);
  } catch (e) {
    next(e);
  }
});

// Boost an existing post into a simple BOOST campaign
router.post('/boost', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { postId, dailyBudget, totalBudget, durationDays, currency, destinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = req.body ?? {};
    const campaign = await adService.createBoostCampaign(accountId, {
      postId,
      dailyBudget,
      totalBudget,
      durationDays,
      currency,
      destinationUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    });
    res.status(201).json(campaign);
  } catch (e) {
    next(e);
  }
});

// Serve one relevant ad candidate for current viewer (fallback path for clients
// that do not use feed-side injection).
router.get('/serve', authenticate, async (req, res, next) => {
  try {
    const viewerAccountId = (req as any).user?.accountId;
    if (!viewerAccountId) return res.status(401).json({ error: 'Unauthorized' });

    const now = new Date();
    const campaigns = await prisma.adCampaign.findMany({
      where: {
        status: 'ACTIVE',
        type: 'BOOST',
        postId: { not: null },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        post: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
                verifiedBadge: true,
                accountType: true,
              },
            },
            likes: { select: { accountId: true } },
            comments: { select: { id: true } },
            ProductTag: {
              include: { product: { select: { id: true, name: true, price: true, images: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Basic eligibility checks: budget, ownership, and active date.
    const eligible = campaigns.filter((c) => {
      if (!c.post) return false;
      if (c.accountId === viewerAccountId) return false;
      if (c.totalBudget != null && c.spent >= c.totalBudget) return false;
      return true;
    });
    if (!eligible.length) return res.json({ ad: null });

    const ad = eligible[Math.floor(Math.random() * eligible.length)];
    const p = ad.post!;

    res.json({
      id: ad.id,
      type: 'ad',
      campaignId: ad.id,
      post: {
        id: p.id,
        caption: p.caption,
        media: p.media,
        location: p.location,
        createdAt: p.createdAt,
        likeCount: p.likes.length,
        commentCount: p.comments.length,
        productTags: (p.ProductTag ?? []).map((t) => ({
          productId: t.productId,
          x: t.x,
          y: t.y,
          product: t.product,
        })),
      },
      business: {
        id: p.account.id,
        username: p.account.username,
        displayName: p.account.displayName,
        avatar: p.account.profilePhoto,
        verifiedBadge: p.account.verifiedBadge,
      },
      destinationUrl: ad.destinationUrl,
      utm: {
        source: ad.utmSource,
        medium: ad.utmMedium,
        campaign: ad.utmCampaign,
        term: ad.utmTerm,
        content: ad.utmContent,
      },
    });
  } catch (e) {
    next(e);
  }
});

// Explicit impression tracking endpoint (in addition to analytics/record-event).
router.post('/track-impression', authenticate, async (req, res, next) => {
  try {
    const campaignId = String(req.body?.campaignId || '');
    if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true },
    });
    if (!campaign || campaign.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Campaign not available' });
    }
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    await prisma.adCampaignInsight.upsert({
      where: { campaignId_date: { campaignId, date: day } },
      create: { campaignId, date: day, impressions: 1, clicks: 0, spend: 0 },
      update: { impressions: { increment: 1 } },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Explicit click tracking endpoint (in addition to analytics/record-event).
router.post('/track-click', authenticate, async (req, res, next) => {
  try {
    const campaignId = String(req.body?.campaignId || '');
    if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true, totalBudget: true, spent: true },
    });
    if (!campaign || campaign.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Campaign not available' });
    }
    const costPerClick = Number(process.env.ADS_COST_PER_CLICK || 0.1);
    if (campaign.totalBudget != null && campaign.spent + costPerClick > campaign.totalBudget) {
      await prisma.adCampaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED' },
      });
      return res.status(400).json({ error: 'Campaign budget exhausted' });
    }
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    await prisma.$transaction([
      prisma.adCampaignInsight.upsert({
        where: { campaignId_date: { campaignId, date: day } },
        create: { campaignId, date: day, impressions: 0, clicks: 1, spend: costPerClick },
        update: { clicks: { increment: 1 }, spend: { increment: costPerClick } },
      }),
      prisma.adCampaign.update({
        where: { id: campaignId },
        data: { spent: { increment: costPerClick } },
      }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// List saved audiences for current account
router.get('/audiences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const audiences = await adService.listAudiences(accountId);
    res.json({ audiences });
  } catch (e) {
    next(e);
  }
});

// Create a saved audience
router.post('/audiences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { name, description, definition } = req.body ?? {};
    const audience = await adService.createAudience(accountId, {
      name,
      description,
      definition,
    });
    res.status(201).json(audience);
  } catch (e) {
    next(e);
  }
});

// Attach an audience to a campaign
router.post('/campaigns/:id/audiences/:audienceId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const campaign = await adService.attachAudienceToCampaign(accountId, req.params.id, req.params.audienceId);
    res.json(campaign);
  } catch (e) {
    next(e);
  }
});

// Billing summary for current advertiser account (credits, spend, invoices)
router.get('/billing/summary', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const summary = await adBillingService.getSummary(accountId);
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

// Top up ad credits for current advertiser account
router.post('/billing/top-up', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { amount, paymentMethod, externalPaymentId } = req.body ?? {};
    const parsedAmount = Number(amount);
    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }
    const result = await adBillingService.topUpCredits(accountId, parsedAmount, {
      paymentMethod,
      externalPaymentId,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

export default router;

