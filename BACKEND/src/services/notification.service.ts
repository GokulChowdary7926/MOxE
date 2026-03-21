/**
 * Notification workflow: list (all/mentions), create, mark read.
 * Quiet mode (1.2): skip creating notification when recipient is in quiet window.
 * Real-time: emit to recipient socket room on create.
 */
import { prisma } from '../server';
import { emitNotification } from '../sockets';

const DEFAULT_LIMIT = 30;

function isInQuietWindow(account: { quietModeEnabled: boolean; quietModeStart: string | null; quietModeEnd: string | null; quietModeDays: unknown } | null): boolean {
  if (!account?.quietModeEnabled || !account.quietModeStart || !account.quietModeEnd) return false;
  const days = Array.isArray(account.quietModeDays) ? account.quietModeDays as number[] : [];
  const now = new Date();
  const day = now.getDay();
  if (days.length > 0 && !days.includes(day)) return false;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const start = account.quietModeStart;
  const end = account.quietModeEnd;
  if (start <= end) return timeStr >= start && timeStr < end;
  return timeStr >= start || timeStr < end;
}

export class NotificationService {
  async list(recipientId: string, tab: 'all' | 'mentions', cursor?: string, limit: number = DEFAULT_LIMIT) {
    const where: { recipientId: string; type?: { in: string[] } } = { recipientId: recipientId };
    if (tab === 'mentions') where.type = { in: ['MENTION', 'TAG'] };

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    const nextCursor = items.length > limit ? items[limit - 1].id : null;
    return { items: items.slice(0, limit), nextCursor };
  }

  async markRead(recipientId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, recipientId },
      data: { read: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(recipientId: string) {
    await prisma.notification.updateMany({
      where: { recipientId },
      data: { read: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async create(recipientId: string, type: string, senderId?: string, content?: string, data?: object) {
    const recipient = await prisma.account.findUnique({
      where: { id: recipientId },
      select: { quietModeEnabled: true, quietModeStart: true, quietModeEnd: true, quietModeDays: true },
    });
    if (isInQuietWindow(recipient)) return null;
    const notification = await prisma.notification.create({
      data: { recipientId, senderId: senderId || null, type, content: content || null, data: data || undefined },
      include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    emitNotification(recipientId, {
      id: notification.id,
      type: notification.type,
      content: notification.content,
      createdAt: notification.createdAt?.toISOString?.() ?? new Date().toISOString(),
      read: notification.read,
      sender: notification.sender,
    });
    return notification;
  }
}
