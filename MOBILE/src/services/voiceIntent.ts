/**
 * Native voice commands: send transcript to /api/voice/intent and return parsed intent.
 * Use with expo-speech-recognition or any STT source.
 */
import { apiPost } from '../config/api';

export type VoiceIntent = {
  intent: string;
  target?: string;
  content?: string;
  confidence: number;
};

export async function parseVoiceIntent(transcript: string): Promise<VoiceIntent> {
  const text = (transcript || '').trim();
  if (!text) return { intent: 'UNKNOWN', confidence: 0 };
  return apiPost<VoiceIntent>('voice/intent', { text });
}
