import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AdService } from '../services/ad.service';
import { AdBillingService } from '../services/ad-billing.service';

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
    const { postId, dailyBudget, totalBudget, durationDays, currency } = req.body ?? {};
    const campaign = await adService.createBoostCampaign(accountId, {
      postId,
      dailyBudget,
      totalBudget,
      durationDays,
      currency,
    });
    res.status(201).json(campaign);
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

