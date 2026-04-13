/**
 * Activity: watch history, screen time, recent searches, link history, account change log.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const MAX_BEAT_SECONDS = 120;
const MAX_RECENT_SEARCHES = 80;
const MAX_LINK_OPENS = 200;

const WATCH_HISTORY_DAYS = 30;
const WATCH_HISTORY_LIMIT = 100;

function firstMediaThumb(media: unknown): string {
  if (!Array.isArray(media) || media.length === 0) return '';
  const m = media[0] as Record<string, unknown>;
  const url = m.thumbnailUrl ?? m.thumbnail ?? m.url ?? m.src ?? m.preview;
  return typeof url === 'string' ? url : '';
}

export type WatchHistoryItem = {
  id: string;
  thumbUrl: string;
  viewCount?: number;
  isReel: boolean;
};

export async function getWatchHistory(accountId: string): Promise<{ items: WatchHistoryItem[] }> {
  const since = new Date(Date.now() - WATCH_HISTORY_DAYS * 24 * 60 * 60 * 1000);

  const [reelViews, postViews] = await Promise.all([
    prisma.reelView.findMany({
      where: { accountId, viewedAt: { gte: since } },
      orderBy: { viewedAt: 'desc' },
      take: WATCH_HISTORY_LIMIT,
      include: {
        reel: { select: { id: true, thumbnail: true, video: true, views: true } },
      },
    }),
    prisma.view.findMany({
      where: {
        accountId,
        postId: { not: null },
        viewedAt: { gte: since },
      },
      orderBy: { viewedAt: 'desc' },
      take: WATCH_HISTORY_LIMIT,
      include: {
        post: { select: { id: true, media: true, isDeleted: true } },
      },
    }),
  ]);

  type Merge = WatchHistoryItem & { _t: number };

  const merged: Merge[] = [];

  for (const rv of reelViews) {
    if (!rv.reel) continue;
    const thumbUrl = rv.reel.thumbnail || rv.reel.video;
    if (!thumbUrl) continue;
    merged.push({
      id: rv.reel.id,
      thumbUrl,
      viewCount: rv.reel.views,
      isReel: true,
      _t: rv.viewedAt.getTime(),
    });
  }

  for (const v of postViews) {
    if (!v.postId || !v.post || v.post.isDeleted) continue;
    const thumbUrl = firstMediaThumb(v.post.media);
    if (!thumbUrl) continue;
    merged.push({
      id: v.post.id,
      thumbUrl,
      isReel: false,
      _t: v.viewedAt.getTime(),
    });
  }

  merged.sort((a, b) => b._t - a._t);

  const items: WatchHistoryItem[] = merged.slice(0, WATCH_HISTORY_LIMIT).map(({ _t, ...rest }) => rest);

  return { items };
}

function utcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function recordScreenTimeBeat(accountId: string, secondsRaw: unknown): Promise<{ day: string; seconds: number }> {
  const seconds = Math.min(MAX_BEAT_SECONDS, Math.max(0, Math.floor(Number(secondsRaw) || 0)));
  if (seconds <= 0) {
    const day = utcDay(new Date());
    const row = await prisma.screenTimeDaily.findUnique({
      where: { accountId_day: { accountId, day } },
    });
    return { day: day.toISOString().slice(0, 10), seconds: row?.seconds ?? 0 };
  }
  const day = utcDay(new Date());
  const row = await prisma.screenTimeDaily.upsert({
    where: { accountId_day: { accountId, day } },
    create: { accountId, day, seconds },
    update: { seconds: { increment: seconds } },
  });
  return { day: day.toISOString().slice(0, 10), seconds: row.seconds };
}

export async function getTimeSpentSummary(accountId: string, days = 14): Promise<{
  days: { date: string; seconds: number }[];
  totalSeconds: number;
  dailyAverageSeconds: number;
}> {
  const n = Math.min(90, Math.max(1, Math.floor(days)));
  const end = utcDay(new Date());
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (n - 1));
  const rows = await prisma.screenTimeDaily.findMany({
    where: {
      accountId,
      day: { gte: start, lte: end },
    },
    orderBy: { day: 'asc' },
  });
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r.seconds]));
  const out: { date: string; seconds: number }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, seconds: byDay.get(key) ?? 0 });
  }
  const totalSeconds = out.reduce((a, x) => a + x.seconds, 0);
  const dailyAverageSeconds = n > 0 ? Math.round(totalSeconds / n) : 0;
  return { days: out, totalSeconds, dailyAverageSeconds };
}

export async function addRecentSearch(
  accountId: string,
  input: { type: string; term: string; refId?: string | null },
): Promise<void> {
  const type = String(input.type || 'query').slice(0, 20);
  const term = String(input.term || '').trim().slice(0, 200);
  if (!term) throw new AppError('term required', 400);
  await prisma.recentSearchEntry.deleteMany({
    where: { accountId, type, term },
  });
  await prisma.recentSearchEntry.create({
    data: {
      accountId,
      type,
      term,
      refId: input.refId ? String(input.refId).slice(0, 64) : null,
    },
  });
  const excess = await prisma.recentSearchEntry.count({ where: { accountId } });
  if (excess > MAX_RECENT_SEARCHES) {
    const old = await prisma.recentSearchEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
      take: excess - MAX_RECENT_SEARCHES,
      select: { id: true },
    });
    const ids = old.map((x) => x.id);
    if (ids.length) await prisma.recentSearchEntry.deleteMany({ where: { id: { in: ids } } });
  }
}

export async function listRecentSearches(accountId: string): Promise<{
  items: { id: string; type: string; term: string; refId: string | null; createdAt: string }[];
}> {
  const items = await prisma.recentSearchEntry.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return {
    items: items.map((r) => ({
      id: r.id,
      type: r.type,
      term: r.term,
      refId: r.refId,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function clearRecentSearches(accountId: string): Promise<void> {
  await prisma.recentSearchEntry.deleteMany({ where: { accountId } });
}

export async function deleteRecentSearch(accountId: string, id: string): Promise<void> {
  await prisma.recentSearchEntry.deleteMany({ where: { id, accountId } });
}

export async function addLinkOpen(accountId: string, url: string, title?: string | null): Promise<void> {
  const u = String(url || '').trim().slice(0, 2048);
  if (!u || !/^https?:\/\//i.test(u)) throw new AppError('Valid http(s) URL required', 400);
  await prisma.linkOpen.create({
    data: {
      accountId,
      url: u,
      title: title ? String(title).slice(0, 500) : null,
    },
  });
  const excess = await prisma.linkOpen.count({ where: { accountId } });
  if (excess > MAX_LINK_OPENS) {
    const old = await prisma.linkOpen.findMany({
      where: { accountId },
      orderBy: { openedAt: 'asc' },
      take: excess - MAX_LINK_OPENS,
      select: { id: true },
    });
    const ids = old.map((x) => x.id);
    if (ids.length) await prisma.linkOpen.deleteMany({ where: { id: { in: ids } } });
  }
}

export async function listLinkOpens(accountId: string): Promise<{
  items: { id: string; url: string; title: string | null; openedAt: string }[];
}> {
  const items = await prisma.linkOpen.findMany({
    where: { accountId },
    orderBy: { openedAt: 'desc' },
    take: 100,
  });
  return {
    items: items.map((r) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      openedAt: r.openedAt.toISOString(),
    })),
  };
}

export async function listAccountActivityLogs(accountId: string): Promise<{
  items: {
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    createdAt: string;
    metadata: unknown;
  }[];
}> {
  const items = await prisma.accountActivityLog.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return {
    items: items.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      metadata: r.metadata,
    })),
  };
}

/** Logged when hidden-word filters hide or block inbound content (DM, comment, story, note). */
/** Also includes limit-interaction audit rows (same listing API as Safety Center). */
export const HIDDEN_WORD_MODERATION_TYPES = [
  'hidden_word_filter_dm',
  'hidden_word_filter_comment',
  'hidden_word_filter_story',
  'hidden_word_filter_note',
  'limit_interaction_dm',
  'limit_interaction_comment',
] as const;

export async function listHiddenWordModerationLogs(
  accountId: string,
  options?: { limit?: number; cursorId?: string; types?: string[] },
): Promise<{
  items: {
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    createdAt: string;
    metadata: unknown;
  }[];
  nextCursor: string | null;
}> {
  const allowed = new Set<string>(HIDDEN_WORD_MODERATION_TYPES);
  let typeIn: string[] = [...HIDDEN_WORD_MODERATION_TYPES];
  if (options?.types?.length) {
    typeIn = options.types.filter((t) => allowed.has(t));
    if (typeIn.length === 0) {
      return { items: [], nextCursor: null };
    }
  }
  const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
  const rows = await prisma.accountActivityLog.findMany({
    where: { accountId, type: { in: typeIn } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(options?.cursorId ? { cursor: { id: options.cursorId }, skip: 1 } : {}),
  });
  const nextCursor = rows.length > limit ? rows[limit - 1].id : null;
  const items = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
    metadata: r.metadata,
  }));
  return { items, nextCursor };
}

export async function addAccountActivityLog(
  accountId: string,
  input: { type: string; title: string; description: string; metadata?: unknown },
): Promise<void> {
  try {
    await prisma.accountActivityLog.create({
      data: {
        accountId,
        type: input.type.slice(0, 50),
        title: input.title.slice(0, 200),
        description: input.description.slice(0, 2000),
        metadata: (input.metadata ?? undefined) as object | undefined,
      },
    });
  } catch {
    // Audit logging should never break request flow.
  }
}
