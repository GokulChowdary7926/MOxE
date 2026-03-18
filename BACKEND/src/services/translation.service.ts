import { prisma } from '../server';
import { getTranslationProvider, getSupportedLanguages } from './translation/translationProvider';
import type { SupportedLanguage } from '../types/translation';
import { AppError } from '../utils/AppError';

/** Paid tier (STAR/THICK) only. */
export function requireLiveTranslationTier(account: { subscriptionTier: string }): void {
  if (account.subscriptionTier !== 'STAR' && account.subscriptionTier !== 'THICK') {
    throw new AppError('Real-time translation is available on Star or Thick (paid) plans only.', 403);
  }
}

export interface StartSessionInput {
  callerId: string;
  calleeId: string;
  sourceLang: string;
  targetLang: string;
  synthesizeSpeech?: boolean;
}

export interface StartSessionResult {
  sessionId: string;
  wsPath: string;
  message: string;
}

export async function startTranslationSession(input: StartSessionInput): Promise<StartSessionResult> {
  const account = await prisma.account.findUnique({
    where: { id: input.callerId },
    select: { subscriptionTier: true },
  });
  if (!account) throw new AppError('Account not found', 404);
  requireLiveTranslationTier(account);

  const callee = await prisma.account.findUnique({
    where: { id: input.calleeId },
    select: { id: true },
  });
  if (!callee) throw new AppError('Callee account not found', 404);

  const session = await prisma.translationSession.create({
    data: {
      callerId: input.callerId,
      calleeId: input.calleeId,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      synthesizeSpeech: input.synthesizeSpeech ?? false,
      status: 'active',
    },
  });

  return {
    sessionId: session.id,
    wsPath: `/translate?sessionId=${session.id}`,
    message: 'Translation session started. Connect via WebSocket to send audio and receive subtitles.',
  };
}

export async function stopTranslationSession(sessionId: string, accountId: string): Promise<void> {
  const session = await prisma.translationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, callerId: true, calleeId: true, startedAt: true },
  });
  if (!session) throw new AppError('Session not found', 404);
  if (session.callerId !== accountId && session.calleeId !== accountId) {
    throw new AppError('You are not a participant in this session', 403);
  }

  const endedAt = new Date();
  await prisma.translationSession.update({
    where: { id: sessionId },
    data: { status: 'ended', endedAt },
  });

  const durationSecs = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000);
  if (durationSecs > 0) {
    await prisma.translationUsage.create({
      data: {
        accountId: session.callerId,
        sessionId: session.id,
        durationSecs,
      },
    });
  }
}

export async function getSessionForSocket(
  sessionId: string,
  accountId: string
): Promise<{ sessionId: string; callerId: string; calleeId: string; sourceLang: string; targetLang: string; synthesizeSpeech: boolean } | null> {
  const session = await prisma.translationSession.findUnique({
    where: { id: sessionId, status: 'active' },
    select: { id: true, callerId: true, calleeId: true, sourceLang: true, targetLang: true, synthesizeSpeech: true },
  });
  if (!session) return null;
  if (session.callerId !== accountId && session.calleeId !== accountId) return null;
  return {
    sessionId: session.id,
    callerId: session.callerId,
    calleeId: session.calleeId,
    sourceLang: session.sourceLang,
    targetLang: session.targetLang,
    synthesizeSpeech: session.synthesizeSpeech,
  };
}

export function getLanguages(): SupportedLanguage[] {
  return getSupportedLanguages();
}

/** In-feed text translation: translate a single text (e.g. post caption, comment). */
export async function translateTextForFeed(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim().slice(0, 5000);
  if (!trimmed) return text;
  const provider = getTranslationProvider();
  return provider.translateText(trimmed, sourceLang, targetLang);
}

/** Process a single audio chunk: transcribe then translate. Used by socket handler. */
export async function processAudioChunk(
  sessionId: string,
  audioBuffer: Buffer,
  sourceLang: string,
  targetLang: string,
  synthesizeSpeech: boolean
): Promise<{ text: string; original: string; isFinal: boolean; audio?: Buffer }[]> {
  const provider = getTranslationProvider();
  const results: { text: string; original: string; isFinal: boolean; audio?: Buffer }[] = [];
  const transcriptions = await provider.transcribeAudio(audioBuffer, sourceLang);
  for (const t of transcriptions) {
    if (!t.text || t.text === '[Speech detected]') {
      results.push({ text: t.text, original: t.text, isFinal: t.isFinal });
      continue;
    }
    const translated = await provider.translateText(t.text, sourceLang, targetLang);
    const out: { text: string; original: string; isFinal: boolean; audio?: Buffer } = {
      text: translated,
      original: t.text,
      isFinal: t.isFinal,
    };
    if (synthesizeSpeech && provider.synthesizeSpeech && t.isFinal) {
      try {
        out.audio = await provider.synthesizeSpeech(translated, targetLang);
      } catch {
        // ignore TTS errors
      }
    }
    results.push(out);
  }
  return results;
}
