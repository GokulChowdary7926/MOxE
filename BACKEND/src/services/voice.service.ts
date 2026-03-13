/**
 * Voice commands (3.5): parse text from speech-to-text and map to intents (SOS, schedule post, etc.).
 */
import { SafetyService } from './safety.service';

export type VoiceIntent = 'SOS' | 'SCHEDULE_POST' | 'UNKNOWN';

export interface VoiceCommandResult {
  intent: VoiceIntent;
  trigger?: boolean;
  message?: string;
  data?: { latitude?: number; longitude?: number };
}

export class VoiceService {
  /** Parse voice command text and optionally trigger actions (e.g. SOS). */
  async processCommand(accountId: string, text: string): Promise<VoiceCommandResult> {
    const t = (text || '').trim().toLowerCase();
    if (!t) return { intent: 'UNKNOWN', message: 'No command heard.' };

    // SOS / emergency
    if (/\b(sos|emergency|help me|alert)\b/.test(t)) {
      const safetyService = new SafetyService();
      await safetyService.triggerSOS(accountId, {});
      return {
        intent: 'SOS',
        trigger: true,
        message: 'Emergency alert sent to your contacts.',
      };
    }

    // Schedule post — direct user to create flow
    if (/\b(schedule|scheduled)\b.*\b(post|reel)\b/.test(t) || /\b(post|reel)\b.*\b(schedule|scheduled)\b/.test(t)) {
      return {
        intent: 'SCHEDULE_POST',
        trigger: false,
        message: 'Open Create and set a schedule for your post or reel.',
      };
    }

    return { intent: 'UNKNOWN', message: `Could not match command: "${text.slice(0, 50)}".` };
  }
}
