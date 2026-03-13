import type { TranslationProvider as ITranslationProvider, TranscriptionResult, SupportedLanguage } from '../../types/translation';

/**
 * Mock translation provider for development and testing.
 * Does not call any external API. Replace with GoogleCloudTranslationProvider when keys are set.
 */
class MockTranslationProvider implements ITranslationProvider {
  private readonly supportedLanguages: SupportedLanguage[] = [
    { code: 'en', name: 'English' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'es', name: 'Spanish' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'fr', name: 'French' },
    { code: 'hi', name: 'Hindi' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ko', name: 'Korean' },
  ];

  async transcribeAudio(audioChunk: Buffer, _languageCode: string): Promise<TranscriptionResult[]> {
    if (audioChunk.length < 100) return [];
    // Simulate interim result then final after a short delay (caller can await or fire-and-forget).
    const placeholder = '[Speech detected]';
    return [
      { text: placeholder, isFinal: false },
      { text: placeholder, isFinal: true },
    ];
  }

  async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!text || text === '[Speech detected]') return text;
    // Mock: return original with a prefix to show translation path; real provider would translate.
    const shortSource = sourceLang.split('-')[0];
    const shortTarget = targetLang.split('-')[0];
    return `[${shortSource}→${shortTarget}] ${text}`;
  }

  async synthesizeSpeech(_text: string, _languageCode: string): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return this.supportedLanguages;
  }
}

/** Singleton. Set TRANSLATION_PROVIDER=google and env keys to use Google (when implemented). */
let providerInstance: ITranslationProvider & { getSupportedLanguages?: () => SupportedLanguage[] } | null = null;

export function getTranslationProvider(): ITranslationProvider {
  if (!providerInstance) {
    providerInstance = new MockTranslationProvider();
  }
  return providerInstance;
}

export function getSupportedLanguages(): SupportedLanguage[] {
  const p = getTranslationProvider() as MockTranslationProvider;
  return (p as MockTranslationProvider).getSupportedLanguages?.() ?? [];
}
