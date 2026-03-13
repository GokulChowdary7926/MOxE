import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { VoiceService } from '../services/voice.service';

const router = Router();
const voiceService = new VoiceService();

/**
 * Voice SOS / utility commands: POST /api/voice/command { text }
 */
router.post('/command', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { text } = (req as any).body ?? {};
    const result = await voiceService.processCommand(accountId, typeof text === 'string' ? text : '');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

type IntentResponse = {
  intent: string;
  target?: string;
  content?: string;
  confidence: number;
};

function parseIntent(text: string): IntentResponse {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // "message emma what's up"
  const msgMatch = /^message\s+(@?\w+)\s+(.+)/i.exec(raw);
  if (msgMatch) {
    const target = msgMatch[1].replace(/^@/, '');
    const content = msgMatch[2].trim();
    return { intent: 'SEND_MESSAGE', target, content, confidence: 0.93 };
  }

  // "open messages", "go to profile", "open map"
  const navMatch = /^(open|go to)\s+(home|profile|messages|map|streaks|anonymous)/i.exec(lower);
  if (navMatch) {
    const dest = navMatch[2];
    return { intent: 'NAVIGATE', target: dest.toUpperCase(), confidence: 0.9 };
  }

  // "post story ..." / "create story ..."
  const storyMatch = /^(post|create)\s+story\s*(.*)$/i.exec(raw);
  if (storyMatch) {
    const content = storyMatch[2]?.trim() || '';
    return { intent: 'CREATE_STORY', content, confidence: 0.9 };
  }

  return { intent: 'UNKNOWN', confidence: 0.3 };
}

/**
 * Intent parser for navigation + quick actions: POST /api/voice/intent { text }
 * This is used by the web MobileHeader voice commands.
 */
router.post('/intent', authenticate, async (req, res, next) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'text required' });
    const intent = parseIntent(text);
    res.json(intent);
  } catch (e) {
    next(e);
  }
});

export default router;

