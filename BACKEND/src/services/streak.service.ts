/**
 * Lifestyle streaks: check-in by type (GYM, MEDITATION, etc.), list streaks.
 */
import { prisma } from '../server';

const STREAK_TYPES = ['GYM', 'MEDITATION', 'READING', 'STUDY', 'GAMING', 'MOVIES'] as const;
export type StreakType = (typeof STREAK_TYPES)[number];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / (24 * 60 * 60 * 1000));
}

export class StreakService {
  /** Check in for a streak type. Idempotent if already checked in today. */
  async checkIn(accountId: string, type: string): Promise<{ currentCount: number; longestCount: number }> {
    const typeNorm = type.toUpperCase().slice(0, 50);
    const now = new Date();
    const today = startOfDay(now);

    const existing = await prisma.streak.findUnique({
      where: { accountId_type: { accountId, type: typeNorm } },
    });

    let currentCount: number;
    let longestCount: number;

    if (!existing) {
      currentCount = 1;
      longestCount = 1;
      await prisma.streak.create({
        data: {
          accountId,
          type: typeNorm,
          currentCount: 1,
          longestCount: 1,
          lastCheckIn: now,
        },
      });
    } else {
      const last = existing.lastCheckIn ? startOfDay(existing.lastCheckIn) : null;
      const daysSince = last != null ? daysBetween(last, now) : 999;

      if (daysSince === 0) {
        return { currentCount: existing.currentCount, longestCount: existing.longestCount };
      }
      if (daysSince === 1) {
        currentCount = existing.currentCount + 1;
      } else {
        currentCount = 1;
      }
      longestCount = Math.max(existing.longestCount, currentCount);

      await prisma.streak.upsert({
        where: { accountId_type: { accountId, type: typeNorm } },
        create: { accountId, type: typeNorm, currentCount, longestCount, lastCheckIn: now },
        update: { currentCount, longestCount, lastCheckIn: now },
      });
    }

    return { currentCount, longestCount };
  }

  async list(accountId: string): Promise<{ type: string; currentCount: number; longestCount: number; lastCheckIn: string | null }[]> {
    const rows = await prisma.streak.findMany({
      where: { accountId },
      orderBy: { type: 'asc' },
    });
    return rows.map((r) => ({
      type: r.type,
      currentCount: r.currentCount,
      longestCount: r.longestCount,
      lastCheckIn: r.lastCheckIn?.toISOString() ?? null,
    }));
  }

  getTypes(): string[] {
    return [...STREAK_TYPES];
  }
}
