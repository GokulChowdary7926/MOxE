import { AppError } from '../../utils/AppError';

const mockProvider = {
  translateText: jest.fn(),
  transcribeAudio: jest.fn(),
  synthesizeSpeech: jest.fn(),
};

jest.mock('../translation/translationProvider', () => ({
  getTranslationProvider: () => mockProvider,
  getSupportedLanguages: () => [{ code: 'en', name: 'English' }],
}));

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    translationSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    translationUsage: { create: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');
const {
  startTranslationSession,
  stopTranslationSession,
  translateTextForFeed,
  processAudioChunk,
} = require('../translation.service');

describe('translation.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('startTranslationSession rejects when caller account missing', async () => {
    mockPrisma.account.findUnique.mockResolvedValueOnce(null);
    await expect(
      startTranslationSession({ callerId: 'a1', calleeId: 'a2', sourceLang: 'en', targetLang: 'es' }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('translateTextForFeed uses provider translation', async () => {
    mockProvider.translateText.mockResolvedValue('hola');
    const out = await translateTextForFeed('hello', 'en', 'es');
    expect(out).toBe('hola');
  });

  it('processAudioChunk translates transcription entries', async () => {
    mockProvider.transcribeAudio.mockResolvedValue([{ text: 'hello', isFinal: true }]);
    mockProvider.translateText.mockResolvedValue('hola');
    const rows = await processAudioChunk('s1', Buffer.from('x'), 'en', 'es', false);
    expect(rows[0]).toMatchObject({ text: 'hola', original: 'hello', isFinal: true });
  });

  it('stopTranslationSession rejects non-participant', async () => {
    mockPrisma.translationSession.findUnique.mockResolvedValue({
      id: 's1',
      callerId: 'a1',
      calleeId: 'a2',
      startedAt: new Date(Date.now() - 1000),
    });
    await expect(stopTranslationSession('s1', 'a3')).rejects.toBeInstanceOf(AppError);
  });
});
