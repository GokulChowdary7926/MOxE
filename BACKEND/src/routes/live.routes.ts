import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { LiveService } from '../services/live.service';
import { prisma } from '../server';

const router = Router();
const liveService = new LiveService();

router.get('/', async (_req, res, next) => {
  try {
    const result = await liveService.list();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Ended lives with recordings available for replay. */
router.get('/replays', async (_req, res, next) => {
  try {
    const result = await liveService.listReplays();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId as string | undefined;
    const live = await liveService.get(req.params.id);
    if (live.privacy !== 'PUBLIC') {
      if (!viewerId || viewerId !== live.accountId) {
        return res.status(404).json({ error: 'Live not found' });
      }
    }
    res.json(live);
  } catch (e) {
    next(e);
  }
});

/** 4.8 Live replay: ended live with recording + product tray (for replay view). */
router.get('/:id/replay', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId as string | undefined;
    const replay = await liveService.getReplay(req.params.id);
    if (replay.privacy !== 'PUBLIC') {
      if (!viewerId || viewerId !== replay.account.id) {
        return res.status(404).json({ error: 'Replay not found' });
      }
    }
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

/** End an active live. */
router.patch('/:liveId/end', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const live = await liveService.endLive(accountId, req.params.liveId);
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

/** Guide 9.2.1: Purchase a live badge (Bronze/Silver/Gold/Platinum). */
router.post('/:liveId/badges', authenticate, async (req, res, next) => {
  try {
    const buyerId = (req as any).user?.accountId;
    if (!buyerId) return res.status(401).json({ error: 'Unauthorized' });
    const { tier, amount } = req.body ?? {};
    const result = await liveService.purchaseBadge(buyerId, req.params.liveId, tier ?? 'BRONZE', amount ?? 0);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Guide 9.3.1: Send a gift during live. */
router.post('/:liveId/gifts', authenticate, async (req, res, next) => {
  try {
    const giverId = (req as any).user?.accountId;
    if (!giverId) return res.status(401).json({ error: 'Unauthorized' });
    const { giftType, amount, message } = req.body ?? {};
    const result = await liveService.sendGift(giverId, req.params.liveId, giftType ?? 'HEART', amount ?? 0, message);
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
