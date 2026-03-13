import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AnonymousSpaceService } from '../services/anonymousSpace.service';

const router = Router();
const service = new AnonymousSpaceService();

router.get('/spaces', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.listSpaces(accountId);
    res.json({ spaces: list });
  } catch (e) {
    next(e);
  }
});

router.post('/spaces', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { name?: string; description?: string; isPublic?: boolean };
    const space = await service.createSpace(accountId, {
      name: body.name ?? 'Space',
      description: body.description,
      isPublic: body.isPublic,
    });
    res.status(201).json(space);
  } catch (e) {
    next(e);
  }
});

router.get('/spaces/:spaceId', authenticate, async (req, res, next) => {
  try {
    const space = await service.getSpace(req.params.spaceId);
    res.json(space);
  } catch (e) {
    next(e);
  }
});

router.get('/spaces/:spaceId/posts', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await service.listPosts(req.params.spaceId, accountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/spaces/:spaceId/posts', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { content?: string; mediaUrl?: string };
    const post = await service.createPost(accountId, req.params.spaceId, {
      content: body.content ?? '',
      mediaUrl: body.mediaUrl,
    });
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
});

router.post('/posts/:postId/vote', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { direction?: number };
    const d = body.direction === -1 ? -1 : 1;
    const result = await service.vote(accountId, req.params.postId, d);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/posts/:postId/vote', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await service.removeVote(accountId, req.params.postId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/posts/:postId/report', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { reason?: string };
    await service.reportPost(accountId, req.params.postId, body.reason || 'Inappropriate');
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/posts/:postId/comments', authenticate, async (req, res, next) => {
  try {
    const list = await service.listComments(req.params.postId);
    res.json({ comments: list });
  } catch (e) {
    next(e);
  }
});

router.post('/posts/:postId/comments', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { content?: string; parentId?: string };
    const comment = await service.addComment(accountId, req.params.postId, body.content || '', body.parentId);
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

export default router;
