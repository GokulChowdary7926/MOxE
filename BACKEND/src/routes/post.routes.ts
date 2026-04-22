/**
 * Post routes: feed (algorithm), create, like, comment, save.
 */
import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { FeedService } from '../services/feed.service';
import { PostService } from '../services/post.service';
import { ContentAnalyticsService } from '../services/content-analytics.service';

const router = Router();
const feedService = new FeedService();
const postService = new PostService();
const contentAnalyticsService = new ContentAnalyticsService();

/**
 * Comment thread — MUST be before `/:postId` or Express will treat `comments` as a post id
 * (e.g. GET /posts/comments matches /:postId with postId=comments).
 */
router.get('/comments/:commentId/replies', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const result = await postService.getCommentReplies(req.params.commentId, viewerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    const viewerId = (req as any).user?.accountId ?? null;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const result = await postService.listByAccount(viewerId, accountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** GET /posts/feed — Instagram-style feed: { items, nextCursor }. Each item: id, author: { username, displayName?, avatarUrl? }, media[], caption, likeCount, commentCount, viewerHasLiked, viewerHasSaved, etc. */
router.get('/feed', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await feedService.getFeed(accountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/feed/favorites', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await feedService.getFavoritesFeed(accountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/tagged', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const result = await postService.listTaggedForAccount(accountId, accountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Approved tags only — for profile “Tagged” grid (any profile). */
router.get('/tagged/by/:profileAccountId', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const result = await postService.listTaggedForAccount(viewerId, req.params.profileAccountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/tag-requests/pending', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const result = await postService.listPendingTagRequests(accountId, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/tags/:tagId/approve', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await postService.approveTagRequest(accountId, req.params.tagId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/tags/:tagId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await postService.rejectTagRequest(accountId, req.params.tagId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/archived', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await postService.listArchived(accountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/deleted', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await postService.listRecentlyDeleted(accountId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const post = await postService.create(accountId, req.body);
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
});

/** Likers for a post (newest first). */
router.get('/:postId/likes', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const accounts = await postService.listPostLikers(req.params.postId, viewerId, limit);
    res.json({ accounts });
  } catch (e) {
    next(e);
  }
});

// Fetch a single post by id.
router.get('/:postId', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const post = await postService.getById(req.params.postId, viewerId);
    res.json(post);
  } catch (e) {
    next(e);
  }
});

router.patch('/:postId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { allowComments, hideLikeCount } = req.body as {
      allowComments?: boolean;
      hideLikeCount?: boolean;
    };
    if (typeof allowComments !== 'boolean' && typeof hideLikeCount !== 'boolean') {
      return res.status(400).json({ error: 'allowComments or hideLikeCount required' });
    }
    const updated = await postService.updatePostSettings(accountId, req.params.postId, {
      ...(typeof allowComments === 'boolean' ? { allowComments } : {}),
      ...(typeof hideLikeCount === 'boolean' ? { hideLikeCount } : {}),
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.post('/:postId/like', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const postId = req.params.postId;
    const result = await postService.like(accountId, postId);
    const post = await postService.getById(postId, accountId);
    await contentAnalyticsService.trackLike(postId, 'post', post.accountId);
    feedService.recordInteraction(accountId, postId, 'LIKE').catch(() => {});
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/:postId/like', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const postId = req.params.postId;
    const result = await postService.unlike(accountId, postId);
    await contentAnalyticsService.trackUnlike(postId, 'post');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:postId/comments', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { content, parentId } = req.body;
    const postId = req.params.postId;
    const comment = await postService.comment(accountId, postId, content, parentId);
    const post = await postService.getById(postId, accountId);
    await contentAnalyticsService.trackComment(postId, 'post', post.accountId);
    feedService.recordInteraction(accountId, postId, 'COMMENT').catch(() => {});
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

/** Lightweight interaction endpoint so frontend can record feed views, saves, etc. */
router.post('/:postId/interactions', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const postId = req.params.postId;
    const { type, value } = req.body as { type?: string; value?: number };
    if (!type || !['VIEW', 'LIKE', 'COMMENT', 'SAVE'].includes(type)) {
      return res.status(400).json({ error: 'Invalid interaction type' });
    }
    await feedService.recordInteraction(accountId, postId, type as any, typeof value === 'number' ? value : undefined);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/:postId/comments', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId ?? null;
    const result = await postService.getComments(
      req.params.postId,
      viewerId,
      req.query.cursor as string | undefined,
      Number(req.query.limit) || 30
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Post owner: delete every comment on this post (bulk). */
router.delete('/:postId/comments', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await postService.deleteAllCommentsForPost(accountId, req.params.postId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:postId/hidden-comments', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await postService.getHiddenComments(req.params.postId, accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Global hidden comments list for my posts. */
router.get('/comments/hidden', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const result = await postService.listAllHiddenCommentsForOwner(accountId, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch('/comments/:commentId/approve', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await postService.approveComment(req.params.commentId, accountId);
    res.json(comment);
  } catch (e) {
    next(e);
  }
});

router.patch('/comments/:commentId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await postService.updateComment(accountId, req.params.commentId, req.body.content ?? '');
    res.json(comment);
  } catch (e) {
    next(e);
  }
});

router.delete('/comments/:commentId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await postService.deleteComment(accountId, req.params.commentId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:postId/save', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await postService.save(accountId, req.params.postId, req.body.collectionId);
    const post = await postService.getById(req.params.postId, accountId);
    await contentAnalyticsService.trackSave(req.params.postId, 'post', post.accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/:postId/save', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await postService.unsave(accountId, req.params.postId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:postId/archive', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await postService.archive(accountId, req.params.postId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:postId/unarchive', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await postService.unarchive(accountId, req.params.postId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:postId/restore', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await postService.restoreDeleted(accountId, req.params.postId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:postId/delete', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await postService.softDelete(accountId, req.params.postId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
