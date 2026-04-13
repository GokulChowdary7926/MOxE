import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { ReelService } from '../services/reel.service';
import { prisma } from '../server';

const router = Router();
const reelService = new ReelService();

router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    if (accountId) {
      const viewerId = (req as any).user?.accountId ?? null;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 30, 50);
      const result = await reelService.listByAccount(viewerId, accountId, cursor, limit);
      return res.json(result);
    }
    const viewerId = (req as any).user?.accountId ?? null;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await reelService.list(viewerId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const reel = await reelService.create(accountId, req.body);
    res.status(201).json(reel);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const reel = await reelService.getOneForViewer(viewerId, req.params.id);
    if (!reel) return res.status(404).json({ error: 'Not found' });
    res.json(reel);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/comments', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const result = await reelService.listComments(viewerId, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/comments', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const content = typeof req.body?.content === 'string' ? req.body.content : '';
    const comment = await reelService.addComment(accountId, req.params.id, content);
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

/** Tagged accounts on a reel (collaborators / mentions). */
router.get('/:id/collaborators', optionalAuthenticate, async (req, res, next) => {
  try {
    const reel = await prisma.reel.findFirst({
      where: { id: req.params.id },
      select: { accountId: true },
    });
    if (!reel) return res.status(404).json({ error: 'Reel not found' });
    const mentions = await prisma.mention.findMany({
      where: { reelId: req.params.id },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    const accounts = mentions.map((m) => m.account).filter((a) => a.id !== reel.accountId);
    const seen = new Set<string>();
    const unique = accounts.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    res.json({ collaborators: unique });
  } catch (e) {
    next(e);
  }
});

export default router;
