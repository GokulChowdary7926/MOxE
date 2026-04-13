import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { StoryService } from '../services/story.service';
import { ContentAnalyticsService } from '../services/content-analytics.service';
import { prisma } from '../server';

const router = Router();
const storyService = new StoryService();
const contentAnalyticsService = new ContentAnalyticsService();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const username = typeof req.query?.username === 'string' ? req.query.username : undefined;
    const list = await storyService.listForFeed(accountId, username);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const story = await storyService.create(accountId, req.body);
    res.status(201).json(story);
  } catch (e) {
    next(e);
  }
});

router.post('/share-post', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ error: 'postId required' });
    const story = await storyService.createShareStory(accountId, postId);
    res.status(201).json(story);
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/like', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.getStoryLikeStatus(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/likes', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.listStoryLikes(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/like', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.likeStory(accountId, req.params.storyId);
    const story = await prisma.story.findUnique({ where: { id: req.params.storyId }, select: { accountId: true } });
    if (story?.accountId) {
      await contentAnalyticsService.trackLike(req.params.storyId, 'story', story.accountId);
    }
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/:storyId/like', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.unlikeStory(accountId, req.params.storyId);
    await contentAnalyticsService.trackUnlike(req.params.storyId, 'story');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/view', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const anonymous = req.body?.anonymous === true;
    await storyService.recordView(accountId, req.params.storyId, anonymous);
    const story = await prisma.story.findUnique({ where: { id: req.params.storyId }, select: { accountId: true } });
    if (story?.accountId) {
      await contentAnalyticsService.trackView(req.params.storyId, 'story', story.accountId, 'stories');
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/anonymous-views-remaining', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.getAnonymousViewsRemaining(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/poll-results', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.getPollResults(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/replies', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.listStoryReplies(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/replies', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    const result = await storyService.submitStoryReply(accountId, req.params.storyId, message);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/viewers', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.listStoryViewers(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/mentions', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.listStoryMentions(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/poll-vote', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { stickerIndex, optionIndex } = req.body;
    const si = typeof stickerIndex === 'number' ? stickerIndex : parseInt(String(stickerIndex), 10);
    const oi = typeof optionIndex === 'number' ? optionIndex : parseInt(String(optionIndex), 10);
    if (Number.isNaN(si) || Number.isNaN(oi)) return res.status(400).json({ error: 'stickerIndex and optionIndex required' });
    await storyService.votePoll(accountId, req.params.storyId, si, oi);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/remind', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { notifyAt, eventName } = req.body;
    const at = notifyAt ? new Date(notifyAt) : null;
    if (!at || Number.isNaN(at.getTime())) return res.status(400).json({ error: 'notifyAt (ISO date) required' });
    await storyService.addReminder(accountId, req.params.storyId, at, eventName);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/question', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { stickerIndex, question } = req.body;
    const si = typeof stickerIndex === 'number' ? stickerIndex : parseInt(String(stickerIndex), 10);
    if (Number.isNaN(si) || typeof question !== 'string') return res.status(400).json({ error: 'stickerIndex and question required' });
    const result = await storyService.submitQuestion(accountId, req.params.storyId, si, question);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/questions/:questionId/link-answer', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const answerStoryId = typeof req.body?.answerStoryId === 'string' ? req.body.answerStoryId.trim() : '';
    if (!answerStoryId) return res.status(400).json({ error: 'answerStoryId required' });
    await storyService.linkQuestionAnswer(accountId, req.params.storyId, req.params.questionId, answerStoryId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/questions', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.listQuestionsForStory(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:storyId/emoji-rating', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { stickerIndex, value } = req.body;
    const si = typeof stickerIndex === 'number' ? stickerIndex : parseInt(String(stickerIndex), 10);
    const val = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(si) || Number.isNaN(val)) return res.status(400).json({ error: 'stickerIndex and value (1-10) required' });
    await storyService.submitEmojiRating(accountId, req.params.storyId, si, val);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/emoji-ratings', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.getEmojiSliderResults(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:storyId/add-yours-responses', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await storyService.listAddYoursResponses(accountId, req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
