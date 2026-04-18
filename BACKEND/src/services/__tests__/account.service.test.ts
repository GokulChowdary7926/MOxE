import { AppError } from '../../utils/AppError';
import { AccountService } from '../account.service';

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('AccountService', () => {
  const service = new AccountService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getNotificationPreferences returns defaults merged with stored prefs', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      notificationPrefs: { likes: false, dms: false },
    });

    const prefs = await service.getNotificationPreferences('a1');
    expect(prefs.likes).toBe(false);
    expect(prefs.dms).toBe(false);
    expect(prefs.comments).toBe(true);
    expect(prefs.mentions).toBe(true);
  });

  it('updateNotificationPreferences ignores unknown keys and persists valid updates', async () => {
    mockPrisma.account.findUnique
      .mockResolvedValueOnce({ notificationPrefs: { likes: true, comments: true } })
      .mockResolvedValueOnce({ notificationPrefs: { likes: false, comments: true } });

    const next = await service.updateNotificationPreferences('a1', {
      likes: false,
      unknown: false as any,
    });

    expect(mockPrisma.account.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { notificationPrefs: { likes: false, comments: true } },
    });
    expect(next.likes).toBe(false);
    expect(next.comments).toBe(true);
  });

  it('patchClientSettings deep-merges nested objects', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      clientSettings: {
        map: { theme: 'dark', zoom: 10 },
        notifications: { push: true },
      },
    });

    const result = await service.patchClientSettings('a1', {
      map: { zoom: 12 },
      notifications: { email: false },
    });

    expect(result).toEqual({
      map: { theme: 'dark', zoom: 12 },
      notifications: { push: true, email: false },
    });
    expect(mockPrisma.account.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { clientSettings: result },
    });
  });

  it('patchClientSettings rejects non-object patch body', async () => {
    await expect(service.patchClientSettings('a1', [] as unknown as Record<string, unknown>)).rejects.toBeInstanceOf(AppError);
  });
});
