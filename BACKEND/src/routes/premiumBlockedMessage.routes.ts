/**
 * Premium: messaging blocked users.
 * GET check, POST send, POST action, GET grants.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PremiumBlockedMessageService } from '../services/premiumBlockedMessage.service';

const router = Router();
const service = new PremiumBlockedMessageService();

router.get('/blocked-messages/check', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const recipientId = req.query.recipientId as string;
    if (!recipientId) return res.status(400).json({ error: 'recipientId required' });
    const result = await service.check(accountId, recipientId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/blocked-messages', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { recipientId, content, paidExtension } = req.body;
    if (!recipientId || typeof content !== 'string') return res.status(400).json({ error: 'recipientId and content required' });
    const result = await service.send(accountId, recipientId, content, !!paidExtension);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/blocked-messages/:id/action', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { action, reason, details } = req.body;
    if (!action) return res.status(400).json({ error: 'action required' });
    const result = await service.recordAction(req.params.id, accountId, action, reason, details);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/blocked-messages/grants', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await service.getGrants(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
