import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { StoriesRankingService } from '../services/ranking/storiesRanking.service';
import { ReelsRankingService } from '../services/ranking/reelsRanking.service';
import { ExploreRankingService } from '../services/ranking/exploreRanking.service';
import { JobFeedRankingService } from '../services/ranking/jobFeedRanking.service';
import { YourAlgorithmService } from '../services/ranking/yourAlgorithm.service';
import { prisma } from '../server';

const router = Router();
const storiesRanking = new StoriesRankingService();
const reelsRanking = new ReelsRankingService();
const exploreRanking = new ExploreRankingService();
const jobFeedRanking = new JobFeedRankingService();
const yourAlgorithm = new YourAlgorithmService();

// Ranked stories tray (accounts with active stories, ordered for viewer)
router.get('/stories', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const ranked = await storiesRanking.getRankedAccounts(accountId, 50);
    const accountIds = ranked.map((r) => r.itemId);

    // Fetch active stories for these accounts, ordered by account ranking then story time.
    const stories = await prisma.story.findMany({
      where: {
        accountId: { in: accountIds },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        account: {
          select: { id: true, username: true, profilePhoto: true },
        },
      },
    });

    const byAccount = new Map<string, any[]>();
    for (const s of stories) {
      const bucket = byAccount.get(s.accountId) ?? [];
      bucket.push(s);
      byAccount.set(s.accountId, bucket);
    }

    const ordered = accountIds
      .map((id) => byAccount.get(id))
      .filter((arr): arr is any[] => Array.isArray(arr) && arr.length > 0);

    res.json({ stories: ordered });
  } catch (e) {
    next(e);
  }
});

// Ranked reels for the viewer
router.get('/reels', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId ?? null;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const ranked = await reelsRanking.getRankedReels(accountId, limit);
    const reelIds = ranked.map((r) => r.itemId);

    const reels = await prisma.reel.findMany({
      where: { id: { in: reelIds } },
      include: {
        account: {
          select: { id: true, username: true, displayName: true, profilePhoto: true },
        },
      },
    });

    const byId = new Map(reels.map((r) => [r.id, r]));
    const ordered = reelIds
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => !!r);

    res.json({ reels: ordered, limit });
  } catch (e) {
    next(e);
  }
});

// Generic negative feedback endpoint to downrank content/topics
router.post('/not-interested', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const { targetId, targetType, topic } = req.body || {};

    if (topic) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { userId: true },
      });
      if (account?.userId) {
        await yourAlgorithm.downRankTopic(account.userId, topic);
      }
    }

    if (targetId && targetType === 'POST') {
      await prisma.feedInteraction.create({
        data: {
          accountId,
          postId: targetId,
          type: 'NOT_INTERESTED',
          value: -1,
        },
      });
    }

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// Explore: cross-tool discovery using ContentFeatures + UserEmbedding
router.get('/explore', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });
    if (!account?.userId) return res.status(400).json({ error: 'No user profile for account' });

    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const ranked = await exploreRanking.getRankedItems(account.userId, limit);
    res.json({ items: ranked });
  } catch (e) {
    next(e);
  }
});

// Job feed for JOB accounts
router.get('/job-feed', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const ranked = await jobFeedRanking.getRankedItems(accountId, limit);
    res.json({ items: ranked });
  } catch (e) {
    next(e);
  }
});

// "Your Algorithm" preferences (topics)
router.get('/preferences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });
    if (!account?.userId) return res.status(400).json({ error: 'No user profile for account' });
    const topics = await yourAlgorithm.getUserTopics(account.userId);
    res.json({ topics });
  } catch (e) {
    next(e);
  }
});

router.post('/preferences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });
    if (!account?.userId) return res.status(400).json({ error: 'No user profile for account' });

    const topics = req.body?.topics ?? [];
    await yourAlgorithm.updateUserTopics(account.userId, topics);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;

