import { prisma } from '../server';

export type LimitInteractionState = {
  commentsFrom: string;
  dmsFrom: string;
  duration: string;
  expiresAt: string | null;
  active: boolean;
};

function hoursForDuration(duration: string): number {
  if (duration === '24h') return 24;
  if (duration === '3d') return 72;
  if (duration === '7d') return 168;
  return 720;
}

export class LimitInteractionService {
  async get(accountId: string): Promise<LimitInteractionState> {
    const row = await prisma.limitInteractionSetting.findUnique({
      where: { accountId },
    });
    if (!row) {
      return { commentsFrom: 'everyone', dmsFrom: 'everyone', duration: '24h', expiresAt: null, active: false };
    }
    const active = row.expiresAt ? new Date(row.expiresAt) > new Date() : false;
    return {
      commentsFrom: row.commentsFrom,
      dmsFrom: row.dmsFrom,
      duration: row.duration,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      active,
    };
  }

  /**
   * Partial updates are supported: omit `active` to leave the current expiry as-is
   * (so sub-screens can PATCH commentsFrom / dmsFrom / duration without turning the tool off).
   */
  async save(accountId: string, data: { commentsFrom?: string; dmsFrom?: string; duration?: string; active?: boolean }): Promise<LimitInteractionState> {
    const current = await prisma.limitInteractionSetting.findUnique({
      where: { accountId },
    });
    const nextDuration =
      data.duration !== undefined ? data.duration : current?.duration ?? '24h';
    const hours = hoursForDuration(nextDuration);
    const wasActive = current?.expiresAt ? new Date(current.expiresAt) > new Date() : false;

    let expiresAt: Date | null;
    if (data.active === true) {
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    } else if (data.active === false) {
      expiresAt = null;
    } else if (data.duration !== undefined && wasActive) {
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    } else {
      expiresAt = current?.expiresAt ?? null;
    }

    await prisma.limitInteractionSetting.upsert({
      where: { accountId },
      create: {
        accountId,
        commentsFrom: data.commentsFrom ?? 'everyone',
        dmsFrom: data.dmsFrom ?? 'everyone',
        duration: data.duration ?? '24h',
        expiresAt:
          data.active === true
            ? new Date(Date.now() + hoursForDuration(data.duration ?? '24h') * 60 * 60 * 1000)
            : null,
      },
      update: {
        ...(data.commentsFrom !== undefined && { commentsFrom: data.commentsFrom }),
        ...(data.dmsFrom !== undefined && { dmsFrom: data.dmsFrom }),
        ...(data.duration !== undefined && { duration: data.duration }),
        expiresAt,
      },
    });
    return this.get(accountId);
  }
}
