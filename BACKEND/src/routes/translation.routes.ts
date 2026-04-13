import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  startTranslationSession,
  stopTranslationSession,
  getLanguages,
  translateTextForFeed,
} from '../services/translation.service';
import { prisma } from '../server';
import { isProductionFreeSubscriptionsEnabled } from '../constants/tierCapabilities';

const router = Router();

router.use(authenticate);

/** POST /api/translate/start – Create translation session (STAR/THICK only). */
router.post('/start', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const { calleeId, sourceLang, targetLang, synthesizeSpeech } = req.body as {
      calleeId?: string;
      sourceLang?: string;
      targetLang?: string;
      synthesizeSpeech?: boolean;
    };
    if (!calleeId || !sourceLang || !targetLang) {
      return res.status(400).json({
        error: 'Missing required fields: calleeId, sourceLang, targetLang',
      });
    }

    const result = await startTranslationSession({
      callerId: accountId,
      calleeId,
      sourceLang,
      targetLang,
      synthesizeSpeech,
    });
    res.status(201).json(result);
  } catch (e: any) {
    next(e);
  }
});

/** POST /api/translate/stop – End translation session. */
router.post('/stop', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    await stopTranslationSession(sessionId, accountId);
    res.json({ ok: true, message: 'Session ended' });
  } catch (e: any) {
    next(e);
  }
});

/** POST /api/translate/text – In-feed text translation (post/comment). Body: { text, sourceLang?, targetLang }. */
router.post('/text', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const { text, sourceLang = 'en', targetLang = 'es' } = (req.body || {}) as {
      text?: string;
      sourceLang?: string;
      targetLang?: string;
    };
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text' });
    }

    const translated = await translateTextForFeed(text, sourceLang, targetLang);
    res.json({ translatedText: translated, sourceLang, targetLang });
  } catch (e: any) {
    next(e);
  }
});

/** GET /api/translate/languages – List supported languages (STAR/THICK only). */
router.get('/languages', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true },
    });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (!isProductionFreeSubscriptionsEnabled() && account.subscriptionTier !== 'STAR' && account.subscriptionTier !== 'THICK') {
      return res.status(403).json({
        error: 'Real-time translation is available on Star or Thick (paid) plans only.',
      });
    }

    const languages = getLanguages();
    res.json({ languages });
  } catch (e: any) {
    next(e);
  }
});

export default router;
