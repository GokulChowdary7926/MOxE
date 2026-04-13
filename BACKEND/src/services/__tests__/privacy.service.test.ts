import { PrivacyService } from '../privacy.service';
import { AppError } from '../../utils/AppError';

jest.mock('../../server', () => ({
  prisma: {
    block: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    mute: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    restrict: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    hideStoryFrom: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('PrivacyService', () => {
  const service = new PrivacyService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'target' });
    mockPrisma.block.findUnique.mockResolvedValue(null);
  });

  it('blocks successfully', async () => {
    const result = await service.block('acc1', 'acc2');
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.block.upsert).toHaveBeenCalled();
  });

  it('throws 400 when blocking self', async () => {
    await expect(service.block('acc1', 'acc1')).rejects.toThrow(AppError);
  });

  it('throws 404 when block target does not exist', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    await expect(service.block('acc1', 'missing')).rejects.toThrow(AppError);
  });

  it('canMessage false when blocked by me', async () => {
    mockPrisma.block.findUnique
      .mockResolvedValueOnce({ expiresAt: null })
      .mockResolvedValueOnce(null);
    const result = await service.canMessage('acc1', 'acc2');
    expect(result).toEqual({ canMessage: false, reason: 'blocked_by_you' });
  });

  it('mutes and unmutes successfully', async () => {
    await expect(service.mute('acc1', 'acc2', { mutePosts: true, muteStories: false })).resolves.toEqual({ ok: true });
    await expect(service.unmute('acc1', 'acc2')).resolves.toEqual({ ok: true });
  });

  it('unblock keeps history by expiring the block', async () => {
    await expect(service.unblock('acc1', 'acc2')).resolves.toEqual({ ok: true });
    expect(mockPrisma.block.updateMany).toHaveBeenCalled();
  });

  it('extends temporary block', async () => {
    const result = await service.extendTemporaryBlock('acc1', 'acc2', 7);
    expect(result.ok).toBe(true);
    expect(mockPrisma.block.updateMany).toHaveBeenCalled();
  });

  it('restrict throws 400 for self', async () => {
    await expect(service.restrict('acc1', 'acc1')).rejects.toThrow(AppError);
  });

  it('list methods map rows to DTOs', async () => {
    mockPrisma.block.findMany.mockResolvedValue([
      {
        blocked: { id: 'u1', username: 'u1', displayName: 'User 1', profilePhoto: null },
        expiresAt: null,
      },
    ]);
    mockPrisma.mute.findMany.mockResolvedValue([
      {
        muted: { id: 'u2', username: 'u2', displayName: 'User 2', profilePhoto: null },
        mutePosts: true,
        muteStories: false,
      },
    ]);
    mockPrisma.restrict.findMany.mockResolvedValue([
      {
        restricted: { id: 'u3', username: 'u3', displayName: 'User 3', profilePhoto: null },
      },
    ]);
    mockPrisma.hideStoryFrom.findMany.mockResolvedValue([
      {
        hiddenFrom: { id: 'u4', username: 'u4', displayName: 'User 4', profilePhoto: null },
      },
    ]);

    await expect(service.listBlocked('acc1')).resolves.toHaveLength(1);
    await expect(service.listMuted('acc1')).resolves.toHaveLength(1);
    await expect(service.listRestricted('acc1')).resolves.toHaveLength(1);
    await expect(service.listHideStoryFrom('acc1')).resolves.toHaveLength(1);
  });

  it('hide story add/remove validates account existence', async () => {
    await expect(service.addHideStoryFrom('acc1', 'acc2')).resolves.toEqual({ ok: true });
    await expect(service.removeHideStoryFrom('acc1', 'acc2')).resolves.toEqual({ ok: true });

    mockPrisma.account.findUnique.mockResolvedValueOnce(null);
    await expect(service.addHideStoryFrom('acc1', 'missing')).rejects.toThrow(AppError);
  });

  it('saves and exports hidden words config', async () => {
    mockPrisma.account.findUnique
      .mockResolvedValueOnce({
        hiddenWords: ['spam'],
        hiddenWordsCommentFilter: true,
        hiddenWordsDMFilter: false,
        clientSettings: {},
      })
      .mockResolvedValueOnce({ clientSettings: {} })
      .mockResolvedValueOnce({
        hiddenWords: ['spam', 'scam'],
        hiddenWordsCommentFilter: true,
        hiddenWordsDMFilter: true,
        clientSettings: {
          hiddenWordsConfig: {
            words: ['spam', 'scam'],
            regexPatterns: ['buy\\s+now'],
            allowListAccountIds: ['u1'],
            commentFilterEnabled: true,
            dmFilterEnabled: true,
          },
        },
      });
    await service.saveHiddenWordsConfig('acc1', {
      words: ['spam', 'scam'],
      regexPatterns: ['buy\\s+now'],
      allowListAccountIds: ['u1'],
      dmFilterEnabled: true,
    });
    const exported = await service.exportHiddenWords('acc1');
    expect(exported.words).toEqual(['spam', 'scam']);
    expect(exported.regexPatterns).toEqual(['buy\\s+now']);
  });

  it('rejects invalid hidden word regex', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      hiddenWords: [],
      hiddenWordsCommentFilter: false,
      hiddenWordsDMFilter: false,
      clientSettings: {},
    });
    await expect(service.saveHiddenWordsConfig('acc1', { regexPatterns: ['[invalid'] })).rejects.toThrow(AppError);
  });
});
