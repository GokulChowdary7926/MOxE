/**
 * Real-time translation (Component 4.3.1).
 * Provider abstraction for speech-to-text, translation, and optional text-to-speech.
 */

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  speaker?: string;
}

export interface TranslationProvider {
  /** Stream transcription from audio. For real-time we process chunks and yield interim/final. */
  transcribeAudio(audioChunk: Buffer, languageCode: string): Promise<TranscriptionResult[]>;
  /** Translate text from source to target language. */
  translateText(text: string, sourceLang: string, targetLang: string): Promise<string>;
  /** Optional: synthesize speech for the translated text. */
  synthesizeSpeech?(text: string, languageCode: string): Promise<Buffer>;
}

export interface TranslationMessage {
  type: 'translation';
  text: string;
  original: string;
  isFinal: boolean;
  language?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}
