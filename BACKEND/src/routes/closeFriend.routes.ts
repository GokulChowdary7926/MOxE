import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { CloseFriendService } from '../services/closeFriend.service';

const router = Router();
const service = new CloseFriendService();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.list(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId required' });
    await service.add(accountId, friendId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/:friendId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.remove(accountId, req.params.friendId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
