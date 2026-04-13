/**
 * Privacy routes: block, mute, restrict, hide story from, limit interactions.
 * Mount at /api/privacy
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PrivacyService } from '../services/privacy.service';
import { LimitInteractionService } from '../services/limitInteraction.service';

const router = Router();
const service = new PrivacyService();
const limitService = new LimitInteractionService();

router.use(authenticate);

// Block
router.get('/blocked', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listBlocked(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/block', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: targetId, blockFutureAccounts, durationDays } = req.body;
    if (!targetId) return res.status(400).json({ error: 'accountId required' });
    const days = durationDays != null ? parseInt(String(durationDays), 10) : undefined;
    await service.block(accountId, targetId, !!blockFutureAccounts, Number.isNaN(days) ? undefined : days);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/block/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.unblock(accountId, req.params.accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/blocked/history', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listBlockHistory(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/block/:accountId/extend', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const days = parseInt(String(req.body?.durationDays ?? 0), 10);
    if (!days || Number.isNaN(days)) return res.status(400).json({ error: 'durationDays required' });
    const result = await service.extendTemporaryBlock(accountId, req.params.accountId, days);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** GET /privacy/can-message/:accountId – can the current user message this account? (block status for DMs) */
router.get('/can-message/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const otherId = req.params.accountId;
    if (!otherId) return res.status(400).json({ error: 'accountId required' });
    const result = await service.canMessage(accountId, otherId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Mute
router.get('/muted', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listMuted(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/mute', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: targetId, mutePosts, muteStories } = req.body;
    if (!targetId) return res.status(400).json({ error: 'accountId required' });
    await service.mute(accountId, targetId, { mutePosts, muteStories });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/mute/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.unmute(accountId, req.params.accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/snoozed', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listSnoozedAccounts(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/snooze', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: targetId, durationDays } = req.body;
    if (!targetId) return res.status(400).json({ error: 'accountId required' });
    const days = durationDays != null ? parseInt(String(durationDays), 10) : 30;
    const result = await service.snoozeFeed(accountId, targetId, Number.isNaN(days) ? 30 : days);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/snooze/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.unsnoozeFeed(accountId, req.params.accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Restrict
router.get('/restricted', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listRestricted(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/restrict', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: targetId } = req.body;
    if (!targetId) return res.status(400).json({ error: 'accountId required' });
    await service.restrict(accountId, targetId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/restrict/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.unrestrict(accountId, req.params.accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/hide-story-from', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listHideStoryFrom(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/hide-story-from', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: hiddenFromId } = req.body;
    if (!hiddenFromId) return res.status(400).json({ error: 'accountId required' });
    await service.addHideStoryFrom(accountId, hiddenFromId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/hide-story-from/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.removeHideStoryFrom(accountId, req.params.accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/limit-interactions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const state = await limitService.get(accountId);
    res.json(state);
  } catch (e) {
    next(e);
  }
});

router.patch('/limit-interactions', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const state = await limitService.save(accountId, req.body);
    res.json(state);
  } catch (e) {
    next(e);
  }
});

router.get('/hidden-words', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const config = await service.getHiddenWordsConfig(accountId);
    res.json(config);
  } catch (e) {
    next(e);
  }
});

router.put('/hidden-words', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const config = await service.saveHiddenWordsConfig(accountId, req.body ?? {});
    res.json(config);
  } catch (e) {
    next(e);
  }
});

router.post('/hidden-words/import', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const config = await service.importHiddenWords(accountId, req.body ?? {});
    res.json(config);
  } catch (e) {
    next(e);
  }
});

router.get('/hidden-words/export', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await service.exportHiddenWords(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/anonymous-reporting-default', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await service.getAnonymousReportingDefault(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/anonymous-reporting-default', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const enabled = !!req.body?.anonymousReportingDefault;
    const result = await service.setAnonymousReportingDefault(accountId, enabled);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
