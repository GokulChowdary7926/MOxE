/**
 * Premium: messaging blocked users.
 * GET check, POST send, POST action, GET grants.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PremiumBlockedMessageService } from '../services/premiumBlockedMessage.service';
import { prisma } from '../server';

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

// Recipient view: list premium blocked messages received.
// GET /api/premium/blocked-messages/received?senderId=<accountId>
router.get('/blocked-messages/received', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const senderId = req.query.senderId as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const where: Record<string, unknown> = {
      recipientId: accountId,
    };
    if (senderId) (where as any).senderId = senderId;

    const messages = await prisma.premiumBlockedMessage.findMany({
      where: where as any,
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        actions: { orderBy: { actionedAt: 'desc' }, take: 1 },
      },
    });

    res.json({
      items: messages.map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        sender: m.sender,
        content: m.content,
        sentAt: m.sentAt,
        lastAction: m.actions?.[0]
          ? {
              action: m.actions[0].action,
              reportReason: m.actions[0].reportReason ?? null,
              reportDetails: m.actions[0].reportDetails ?? null,
              actionedAt: m.actions[0].actionedAt,
            }
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
