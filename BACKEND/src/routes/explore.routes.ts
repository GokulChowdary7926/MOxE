/**
 * Explore: trending hashtags, search (users, hashtags, posts).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ExploreService } from '../services/explore.service';

const router = Router();
const exploreService = new ExploreService();

router.get('/trending', authenticate, async (req, res, next) => {
  try {
    const hashtags = await exploreService.getTrendingHashtags();
    res.json(hashtags);
  } catch (e) {
    next(e);
  }
});

router.get('/hashtag/:name/posts', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const name = decodeURIComponent(req.params.name || '');
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const result = await exploreService.getHashtagPosts(accountId, name, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Masonry-friendly public posts when personalized ranking / feed have no items. */
router.get('/discover', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const posts = await exploreService.getRecentPublicPosts(accountId, limit);
    res.json({ posts });
  } catch (e) {
    next(e);
  }
});

router.get('/search', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const q = (req.query.q as string) || '';
    const type = (req.query.type as 'all' | 'users' | 'hashtags' | 'posts') || 'all';
    const result = await exploreService.search(accountId, q, type);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/hashtags/suggest', authenticate, async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const list = await exploreService.suggestHashtags(q, limit);
    res.json({ hashtags: list });
  } catch (e) {
    next(e);
  }
});

export default router;
