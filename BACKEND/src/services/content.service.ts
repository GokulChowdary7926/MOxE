import { prisma } from '../server';
import { AppError } from '../utils/AppError';

/** Log a suspected screenshot on protected content; notify owner if they are Star. */
export class ContentService {
  async logScreenshot(viewerId: string, data: { contentId: string; contentType: string }) {
    const { contentId, contentType } = data;
    if (!contentId || !contentType) throw new AppError('contentId and contentType required', 400);
    if (!['POST', 'STORY'].includes(contentType)) throw new AppError('Invalid contentType', 400);

    let ownerId: string | null = null;
    if (contentType === 'POST') {
      const post = await prisma.post.findUnique({ where: { id: contentId }, select: { accountId: true } });
      ownerId = post?.accountId ?? null;
    } else if (contentType === 'STORY') {
      const story = await prisma.story.findUnique({ where: { id: contentId }, select: { accountId: true } });
      ownerId = story?.accountId ?? null;
    }
    if (!ownerId) throw new AppError('Content not found', 404);

    await prisma.screenshotLog.create({
      data: { contentId, contentType, viewerId, ownerId },
    });

    const owner = await prisma.account.findUnique({
      where: { id: ownerId },
      select: { subscriptionTier: true, notificationPrefs: true },
    });
    const prefs = (owner?.notificationPrefs as Record<string, boolean> | null) ?? {};
    const screenshotAlerts = prefs.screenshotAlerts !== false;
    if (owner?.subscriptionTier === 'STAR' && screenshotAlerts) {
      await prisma.notification.create({
        data: {
          recipientId: ownerId,
          type: 'SCREENSHOT_DETECTED',
          content: 'Someone may have taken a screenshot of your content.',
          data: { contentId, contentType, viewerId } as object,
        },
      });
    }
    return { ok: true };
  }

  async listScreenshotLogsForOwner(
    ownerId: string,
    options?: { limit?: number; cursorId?: string },
  ): Promise<{
    items: Array<{
      id: string;
      contentId: string;
      contentType: string;
      viewerId: string;
      createdAt: string;
    }>;
    nextCursor: string | null;
  }> {
    const limit = Math.min(100, Math.max(1, options?.limit ?? 30));
    const rows = await prisma.screenshotLog.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(options?.cursorId ? { cursor: { id: options.cursorId }, skip: 1 } : {}),
    });
    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;
    const items = rows.slice(0, limit).map((r) => ({
      id: r.id,
      contentId: r.contentId,
      contentType: r.contentType,
      viewerId: r.viewerId,
      createdAt: r.createdAt.toISOString(),
    }));
    return { items, nextCursor };
  }

  async getScreenshotAlertPreference(accountId: string): Promise<{ screenshotAlerts: boolean }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { notificationPrefs: true },
    });
    const prefs = (account?.notificationPrefs as Record<string, unknown> | null) ?? {};
    return { screenshotAlerts: prefs.screenshotAlerts !== false };
  }

  async setScreenshotAlertPreference(accountId: string, screenshotAlerts: boolean): Promise<{ screenshotAlerts: boolean }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { notificationPrefs: true },
    });
    const prefs = (account?.notificationPrefs as Record<string, unknown> | null) ?? {};
    await prisma.account.update({
      where: { id: accountId },
      data: {
        notificationPrefs: {
          ...prefs,
          screenshotAlerts: !!screenshotAlerts,
        } as any,
      },
    });
    return { screenshotAlerts: !!screenshotAlerts };
  }
}
