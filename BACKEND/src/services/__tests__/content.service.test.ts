import { AppError } from '../../utils/AppError';
import { ContentService } from '../content.service';

jest.mock('../../server', () => ({
  prisma: {
    post: { findUnique: jest.fn() },
    story: { findUnique: jest.fn() },
    screenshotLog: { create: jest.fn(), findMany: jest.fn() },
    account: { findUnique: jest.fn(), update: jest.fn() },
    notification: { create: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('ContentService', () => {
  const service = new ContentService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logScreenshot validates contentType', async () => {
    await expect(
      service.logScreenshot('viewer1', { contentId: 'c1', contentType: 'REEL' as any }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('logScreenshot throws when content owner not found', async () => {
    mockPrisma.post.findUnique.mockResolvedValue(null);
    await expect(
      service.logScreenshot('viewer1', { contentId: 'p1', contentType: 'POST' }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('setScreenshotAlertPreference updates account prefs', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ notificationPrefs: { likes: true } });
    mockPrisma.account.update.mockResolvedValue({});
    const out = await service.setScreenshotAlertPreference('a1', false);
    expect(out).toEqual({ screenshotAlerts: false });
    expect(mockPrisma.account.update).toHaveBeenCalled();
  });
});
