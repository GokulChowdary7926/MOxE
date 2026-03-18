import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { pushService } from '../services/push.service';

const router = Router();

router.get('/vapid-public-key', (_req, res) => {
  const key = pushService.getVapidPublicKey();
  if (!key) return res.status(404).json({ error: 'VAPID public key not configured' });
  res.json({ publicKey: key });
});

router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    await pushService.subscribe(userId, subscription);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/unsubscribe', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    await pushService.unsubscribe(userId, endpoint);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/test', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await pushService.sendToUser(userId, {
      title: 'MOxE test notification',
      body: 'This is a test push from MOxE backend.',
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

