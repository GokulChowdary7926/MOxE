import { prisma } from '../server';

export type LimitInteractionState = {
  commentsFrom: string;
  dmsFrom: string;
  duration: string;
  expiresAt: string | null;
  active: boolean;
};

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

  async save(accountId: string, data: { commentsFrom?: string; dmsFrom?: string; duration?: string; active?: boolean }): Promise<LimitInteractionState> {
    const duration = data.duration || '24h';
    const hours = duration === '24h' ? 24 : duration === '3d' ? 72 : duration === '7d' ? 168 : 720;
    const expiresAt = data.active ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;
    await prisma.limitInteractionSetting.upsert({
      where: { accountId },
      create: {
        accountId,
        commentsFrom: data.commentsFrom ?? 'everyone',
        dmsFrom: data.dmsFrom ?? 'everyone',
        duration,
        expiresAt,
      },
      update: {
        ...(data.commentsFrom !== undefined && { commentsFrom: data.commentsFrom }),
        ...(data.dmsFrom !== undefined && { dmsFrom: data.dmsFrom }),
        duration,
        expiresAt,
      },
    });
    return this.get(accountId);
  }
}
