/**
 * Creator tools routes: quick replies, auto-responses, content calendar,
 * best time, trending audio, content ideas, creator network, brand marketplace, reel bonus.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { CreatorToolsService } from '../services/creatorTools.service';

const router = Router();
const creatorTools = new CreatorToolsService();

router.use(authenticate);

/** 13.2 Quick replies (message templates) */
router.get('/quick-replies', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const shortcut = req.query.shortcut as string | undefined;
    const list = await creatorTools.listMessageTemplates(accountId);
    const templates = shortcut
      ? list.filter((t) => t.shortcut.toLowerCase() === shortcut.replace(/^\//, '').toLowerCase())
      : list;
    res.json({ templates });
  } catch (e) {
    next(e);
  }
});
router.get('/quick-replies/:shortcut', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const shortcut = req.params.shortcut.replace(/^\//, '').toLowerCase();
    const list = await creatorTools.listMessageTemplates(accountId);
    const template = list.find((t) => t.shortcut.toLowerCase() === shortcut);
    if (!template) return res.status(404).json({ error: 'Quick reply not found' });
    res.json(template);
  } catch (e) {
    next(e);
  }
});
router.post('/quick-replies', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const template = await creatorTools.createMessageTemplate(accountId, req.body);
    res.status(201).json(template);
  } catch (e) {
    next(e);
  }
});
router.patch('/quick-replies/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const template = await creatorTools.updateMessageTemplate(accountId, req.params.id, req.body);
    res.json(template);
  } catch (e) {
    next(e);
  }
});
router.delete('/quick-replies/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await creatorTools.deleteMessageTemplate(accountId, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 13.3 Auto-response rules */
router.get('/auto-responses', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await creatorTools.listAutoResponseRules(accountId);
    res.json({ rules: list });
  } catch (e) {
    next(e);
  }
});
router.post('/auto-responses', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const rule = await creatorTools.createAutoResponseRule(accountId, req.body);
    res.status(201).json(rule);
  } catch (e) {
    next(e);
  }
});
router.patch('/auto-responses/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const rule = await creatorTools.updateAutoResponseRule(accountId, req.params.id, req.body);
    res.json(rule);
  } catch (e) {
    next(e);
  }
});
router.delete('/auto-responses/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await creatorTools.deleteAutoResponseRule(accountId, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 11.3 Content calendar */
router.get('/content-calendar', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const month = (req.query.month as string) || '';
    const result = await creatorTools.getContentCalendar(accountId, month);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 11.4.4 Best time recommendations */
router.get('/best-time', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await creatorTools.getBestTimeRecommendations(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 11.1 Trending audio */
router.get('/trending-audio', async (req, res, next) => {
  try {
    const genre = req.query.genre as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await creatorTools.getTrendingAudio(genre, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 11.2 Content ideas */
router.get('/content-ideas', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const niche = req.query.niche as string | undefined;
    const result = await creatorTools.getContentIdeas(accountId, niche);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 12.2 Creator network */
router.get('/network', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const status = req.query.status as string | undefined;
    const niche = req.query.niche as string | undefined;
    const result = await creatorTools.listCreatorNetwork(accountId, niche, status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
router.post('/network/:peerId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const conn = await creatorTools.sendCreatorConnectionRequest(accountId, req.params.peerId);
    res.status(201).json(conn);
  } catch (e) {
    next(e);
  }
});
router.post('/network/accept/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const conn = await creatorTools.acceptCreatorConnection(accountId, req.params.id);
    res.json(conn);
  } catch (e) {
    next(e);
  }
});

/** 12.3 Brand marketplace */
router.get('/campaigns', async (req, res, next) => {
  try {
    const niche = req.query.niche as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await creatorTools.listBrandCampaigns(niche, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
router.post('/campaigns/:campaignId/apply', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { message } = req.body ?? {};
    const app = await creatorTools.applyToBrandCampaign(accountId, req.params.campaignId, message);
    res.status(201).json(app);
  } catch (e) {
    next(e);
  }
});
router.get('/campaign-applications', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await creatorTools.listMyCampaignApplications(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** 9.4 Reel bonus (my bonuses) */
router.get('/bonuses', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await creatorTools.listMyReelBonuses(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
