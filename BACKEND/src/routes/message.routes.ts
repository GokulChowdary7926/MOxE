/**
 * Message workflow: thread list, get thread, send, mark read.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { MessageService } from '../services/message.service';

const router = Router();
const messageService = new MessageService();

router.get('/threads', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const label = (req as any).query?.label as string | undefined;
    const threads = await messageService.getThreads(accountId, label);
    res.json(threads);
  } catch (e) {
    next(e);
  }
});
router.post('/threads/:peerId/labels', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { label } = (req as any).body ?? {};
    if (!label) return res.status(400).json({ error: 'label required' });
    const result = await messageService.addConversationLabel(accountId, req.params.peerId, label);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});
router.delete('/threads/:peerId/labels/:label', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await messageService.removeConversationLabel(accountId, req.params.peerId, decodeURIComponent(req.params.label));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const groupId = req.query.groupId as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const limit = Number(req.query.limit) || 50;
    if (groupId) {
      const result = await messageService.getThreadByGroup(accountId, groupId, cursor, limit);
      return res.json(result);
    }
    const otherId = req.query.userId as string;
    if (!otherId) return res.status(400).json({ error: 'userId or groupId required' });
    const result = await messageService.getThread(accountId, otherId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { recipientId, content, messageType, media, isVanish, groupId } = req.body;
    const message = await messageService.send(
      accountId,
      recipientId || '',
      content || '',
      messageType || 'TEXT',
      { media, isVanish: !!isVanish, groupId: groupId || undefined }
    );
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});

router.post('/thread-read', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    await messageService.markThreadRead(accountId, userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/:messageId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const forMeOnly = req.query.forMeOnly === 'true';
    const result = await messageService.deleteMessage(accountId, req.params.messageId, forMeOnly);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:messageId/reaction', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { emoji } = req.body;
    const result = await messageService.addReaction(accountId, req.params.messageId, emoji);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/:messageId/reaction', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await messageService.removeReaction(accountId, req.params.messageId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/pin/:userId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await messageService.pinChat(accountId, req.params.userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/pin/:userId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await messageService.unpinChat(accountId, req.params.userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/mute/:userId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const duration = (req.body.duration as string) || '24h';
    const result = await messageService.muteConversation(accountId, req.params.userId, duration);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/mute/:userId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await messageService.unmuteConversation(accountId, req.params.userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/hide/:userId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await messageService.hideConversation(accountId, req.params.userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/share-post', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { recipientId, postId } = req.body;
    if (!recipientId || !postId) return res.status(400).json({ error: 'recipientId and postId required' });
    const message = await messageService.sharePostToDM(accountId, recipientId, postId);
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});

/** Group polls (1.1): vote on a POLL message. Body: { optionIndex: number }. */
router.post('/:messageId/poll/vote', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const optionIndex = Number(req.body?.optionIndex);
    if (Number.isNaN(optionIndex) || optionIndex < 0) return res.status(400).json({ error: 'optionIndex required (0-based)' });
    const result = await messageService.votePoll(req.params.messageId, accountId, optionIndex);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
