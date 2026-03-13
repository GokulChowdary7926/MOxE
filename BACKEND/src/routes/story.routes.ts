import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { StoryService } from '../services/story.service';

const router = Router();
const storyService = new StoryService();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await storyService.listForFeed(accountId);
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
    await storyService.submitQuestion(accountId, req.params.storyId, si, question);
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
    const result = await storyService.listAddYoursResponses(req.params.storyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
