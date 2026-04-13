import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { LiveService } from '../services/live.service';
import { prisma } from '../server';
import { emitLiveRoomEvent } from '../sockets';

const router = Router();
const liveService = new LiveService();

router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const result = await liveService.list(viewerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Ended lives with recordings available for replay. */
router.get('/replays', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const result = await liveService.listReplays(viewerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Live Q&A (during LIVE). List before /:id so paths are not captured as ids. */
router.get('/:liveId/questions', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = ((req as any).user?.accountId as string | undefined) ?? null;
    const result = await liveService.listLiveQuestions(req.params.liveId, viewerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:liveId/questions', authenticate, async (req, res, next) => {
  try {
    const askerId = (req as any).user?.accountId;
    if (!askerId) return res.status(401).json({ error: 'Unauthorized' });
    const text = typeof (req.body as any)?.text === 'string' ? (req.body as any).text : '';
    const result = await liveService.askLiveQuestion(askerId, req.params.liveId, text);
    emitLiveRoomEvent(req.params.liveId, 'live:question', result);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/:liveId/questions/:questionId/pin', authenticate, async (req, res, next) => {
  try {
    const actorId = (req as any).user?.accountId;
    if (!actorId) return res.status(401).json({ error: 'Unauthorized' });
    const pinned = !!(req.body as any)?.pinned;
    const result = await liveService.pinLiveQuestion(actorId, req.params.liveId, req.params.questionId, pinned);
    emitLiveRoomEvent(req.params.liveId, 'live:question:updated', result);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/:liveId/questions/:questionId/answered', authenticate, async (req, res, next) => {
  try {
    const actorId = (req as any).user?.accountId;
    if (!actorId) return res.status(401).json({ error: 'Unauthorized' });
    const answered = !!(req.body as any)?.answered;
    const result = await liveService.markLiveQuestionAnswered(actorId, req.params.liveId, req.params.questionId, answered);
    emitLiveRoomEvent(req.params.liveId, 'live:question:updated', result);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:liveId/moderators', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = ((req as any).user?.accountId as string | undefined) ?? null;
    const result = await liveService.listLiveModerators(req.params.liveId, viewerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:liveId/moderators', authenticate, async (req, res, next) => {
  try {
    const hostId = (req as any).user?.accountId;
    if (!hostId) return res.status(401).json({ error: 'Unauthorized' });
    const username = typeof (req.body as any)?.username === 'string' ? (req.body as any).username : '';
    const result = await liveService.addLiveModerator(hostId, req.params.liveId, username);
    emitLiveRoomEvent(req.params.liveId, 'live:moderators', result);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/:liveId/moderators/:moderatorId', authenticate, async (req, res, next) => {
  try {
    const hostId = (req as any).user?.accountId;
    if (!hostId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await liveService.removeLiveModerator(hostId, req.params.liveId, req.params.moderatorId);
    emitLiveRoomEvent(req.params.liveId, 'live:moderators', result);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/:liveId/fundraiser', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const b = req.body ?? {};
    const live = await liveService.updateFundraiser(accountId, req.params.liveId, {
      fundraiserTitle: b.fundraiserTitle,
      fundraiserUrl: b.fundraiserUrl,
      fundraiserGoalAmount: b.fundraiserGoalAmount,
      fundraiserCurrency: b.fundraiserCurrency,
    });
    res.json(live);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = ((req as any).user?.accountId as string | undefined) ?? null;
    const live = await liveService.get(req.params.id, viewerId);
    res.json(live);
  } catch (e) {
    next(e);
  }
});

/** 4.8 Live replay: ended live with recording + product tray (for replay view). */
router.get('/:id/replay', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = ((req as any).user?.accountId as string | undefined) ?? null;
    const replay = await liveService.getReplay(req.params.id, viewerId);
    res.json(replay);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true },
    });
    if (!account || (account.accountType !== 'BUSINESS' && account.accountType !== 'CREATOR')) {
      return res.status(403).json({ error: 'Creator or Business account required to go live' });
    }
    const live = await liveService.create(accountId, req.body);
    res.status(201).json(live);
  } catch (e) {
    next(e);
  }
});

/** Start a scheduled live (real-time camera flow). */
router.patch('/:liveId/start', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const live = await liveService.startLive(accountId, req.params.liveId);
    res.json(live);
  } catch (e) {
    next(e);
  }
});

/** End an active live. Optional body: `{ recording?: string }` VOD URL (https or `/uploads/…`). */
router.patch('/:liveId/end', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const recording =
      typeof (req.body as any)?.recording === 'string' ? (req.body as any).recording : undefined;
    const live = await liveService.endLive(accountId, req.params.liveId, { recording });
    res.json(live);
  } catch (e) {
    next(e);
  }
});

/** Set replay recording on an **ended** live (e.g. ingest finished after `end`). */
router.patch('/:liveId/recording', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const recording = typeof (req.body as any)?.recording === 'string' ? (req.body as any).recording : '';
    const live = await liveService.setLiveRecording(accountId, req.params.liveId, recording);
    res.json(live);
  } catch (e) {
    next(e);
  }
});

// Live Shopping: add products to a scheduled/live event
router.post('/:liveId/products', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const live = await liveService.addProductsToLive(accountId, req.params.liveId, req.body);
    res.json(live);
  } catch (e) {
    next(e);
  }
});

router.delete('/:liveId/products/:productId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const live = await liveService.removeProductFromLive(accountId, req.params.liveId, req.params.productId);
    res.json(live);
  } catch (e) {
    next(e);
  }
});

router.patch('/:liveId/pin', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { productId } = req.body ?? {};
    const live = await liveService.setPinnedProduct(accountId, req.params.liveId, productId ?? null);
    res.json(live);
  } catch (e) {
    next(e);
  }
});

router.patch('/:liveId/products/:productId/discount', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { liveDiscountPercent } = req.body ?? {};
    const live = await liveService.setLiveDiscount(accountId, req.params.liveId, req.params.productId, liveDiscountPercent ?? null);
    res.json(live);
  } catch (e) {
    next(e);
  }
});

router.get('/:liveId/sales', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await liveService.getLiveSales(req.params.liveId, accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Stripe PaymentIntent for a live badge (Guide 9.2.1 + NBK-023). Requires LIVE_STRIPE_ENABLED. */
router.post('/:liveId/badges/payment-intent', authenticate, async (req, res, next) => {
  try {
    const buyerId = (req as any).user?.accountId;
    if (!buyerId) return res.status(401).json({ error: 'Unauthorized' });
    const { tier, amount } = req.body ?? {};
    const result = await liveService.createBadgePaymentIntent(
      buyerId,
      req.params.liveId,
      tier ?? 'BRONZE',
      amount ?? 0
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Guide 9.2.1: Purchase a live badge (Bronze/Silver/Gold/Platinum). With Stripe enabled, body must include paymentIntentId after client confirms payment. */
router.post('/:liveId/badges', authenticate, async (req, res, next) => {
  try {
    const buyerId = (req as any).user?.accountId;
    if (!buyerId) return res.status(401).json({ error: 'Unauthorized' });
    const { tier, amount, paymentIntentId } = req.body ?? {};
    const result = await liveService.purchaseBadge(buyerId, req.params.liveId, tier ?? 'BRONZE', amount ?? 0, {
      paymentIntentId,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Stripe PaymentIntent for a live gift (Guide 9.3.1 + NBK-023). */
router.post('/:liveId/gifts/payment-intent', authenticate, async (req, res, next) => {
  try {
    const giverId = (req as any).user?.accountId;
    if (!giverId) return res.status(401).json({ error: 'Unauthorized' });
    const { giftType, amount } = req.body ?? {};
    const result = await liveService.createGiftPaymentIntent(
      giverId,
      req.params.liveId,
      giftType ?? 'HEART',
      amount ?? 0
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Guide 9.3.1: Send a gift during live. With Stripe enabled, body must include paymentIntentId after client confirms payment. */
router.post('/:liveId/gifts', authenticate, async (req, res, next) => {
  try {
    const giverId = (req as any).user?.accountId;
    if (!giverId) return res.status(401).json({ error: 'Unauthorized' });
    const { giftType, amount, message, paymentIntentId } = req.body ?? {};
    const result = await liveService.sendGift(giverId, req.params.liveId, giftType ?? 'HEART', amount ?? 0, message, {
      paymentIntentId,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Guide 9.2.2: Live badge analytics for host. */
router.get('/:liveId/badges/analytics', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await liveService.getBadgeAnalytics(req.params.liveId, accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Guide 9.3.2: Gift analytics for host. */
router.get('/:liveId/gifts/analytics', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await liveService.getGiftAnalytics(req.params.liveId, accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
