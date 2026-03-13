/**
 * Follow and follow-request routes.
 * Mount at /api/follow
 */
import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { FollowService } from '../services/follow.service';

const router = Router();
const service = new FollowService();

/** Public or authenticated: list followers of an account by username (for profile follower list). */
router.get('/followers/by/:username', optionalAuthenticate, async (req, res, next) => {
  try {
    const list = await service.listFollowersByUsername(req.params.username);
    res.json({ followers: list });
  } catch (e) {
    next(e);
  }
});

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { accountId: targetId } = req.body;
    if (!targetId) return res.status(400).json({ error: 'accountId required' });
    const result = await service.follow(accountId, targetId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.unfollow(accountId, req.params.accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/followers/:followerId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.removeFollower(accountId, req.params.followerId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/followers', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listMyFollowers(accountId);
    res.json({ followers: list });
  } catch (e) {
    next(e);
  }
});

router.get('/following', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listFollowing(accountId);
    res.json({ accounts: list });
  } catch (e) {
    next(e);
  }
});

router.get('/requests', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listPendingFollowRequests(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/requests/:requestId/approve', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.approveFollowRequest(accountId, req.params.requestId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/requests/:requestId/decline', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.declineFollowRequest(accountId, req.params.requestId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/status/:accountId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const status = await service.getFollowStatus(accountId, req.params.accountId);
    res.json(status);
  } catch (e) {
    next(e);
  }
});

router.get('/favorites', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listFavorites(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/:accountId/favorite', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const isFavorite = req.body.isFavorite === true;
    await service.setFavorite(accountId, req.params.accountId, isFavorite);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
