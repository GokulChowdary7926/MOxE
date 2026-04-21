/**
 * Highlights: create from archived stories, CRUD, add/remove items.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { normalizeStoredMediaUrl } from '../utils/mediaUrl';

const MAX_ITEMS_PER_HIGHLIGHT = 100;
const MAX_HIGHLIGHTS = 50;

async function normalizeHighlightMedia<T extends { coverImage?: string | null; items?: any[] }>(h: T): Promise<T> {
  const normalizedItems = Array.isArray(h.items)
    ? await Promise.all(
        h.items.map(async (item) => ({
          ...item,
          story: item.story
            ? {
                ...item.story,
                media:
                  typeof item.story.media === 'string'
                    ? await normalizeStoredMediaUrl(item.story.media)
                    : item.story.media,
              }
            : item.story,
          archivedStory: item.archivedStory
            ? {
                ...item.archivedStory,
                media:
                  typeof item.archivedStory.media === 'string'
                    ? await normalizeStoredMediaUrl(item.archivedStory.media)
                    : item.archivedStory.media,
              }
            : item.archivedStory,
        })),
      )
    : h.items;
  return {
    ...h,
    coverImage:
      typeof h.coverImage === 'string' ? await normalizeStoredMediaUrl(h.coverImage) : h.coverImage,
    items: normalizedItems,
  };
}

export class HighlightService {
  async list(accountId: string) {
    const list = await prisma.highlight.findMany({
      where: { accountId, deletedAt: null },
      orderBy: { order: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            story: { select: { id: true, media: true, type: true } },
            archivedStory: { select: { id: true, media: true, type: true } },
          },
        },
      },
    });
    return Promise.all(list.map((h) => normalizeHighlightMedia(h)));
  }

  async getById(accountId: string, highlightId: string) {
    const h = await prisma.highlight.findFirst({
      where: { id: highlightId, accountId, deletedAt: null },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            story: { select: { id: true, media: true, type: true } },
            archivedStory: { select: { id: true, media: true, type: true } },
          },
        },
      },
    });
    if (!h) throw new AppError('Highlight not found', 404);
    return await normalizeHighlightMedia(h);
  }

  /** Public: get any highlight by id (for viewing on profile). */
  async getByIdPublic(highlightId: string) {
    const h = await prisma.highlight.findFirst({
      where: { id: highlightId, deletedAt: null },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            story: { select: { id: true, media: true, type: true } },
            archivedStory: { select: { id: true, media: true, type: true } },
          },
        },
      },
    });
    if (!h) throw new AppError('Highlight not found', 404);
    return await normalizeHighlightMedia(h);
  }

  async create(accountId: string, data: { name: string; coverImage?: string; archivedStoryIds: string[] }) {
    const count = await prisma.highlight.count({ where: { accountId, deletedAt: null } });
    if (count >= MAX_HIGHLIGHTS) throw new AppError('Maximum number of highlights reached', 400);

    const ids = (data.archivedStoryIds || []).slice(0, MAX_ITEMS_PER_HIGHLIGHT);
    const archived = await prisma.archivedStory.findMany({
      where: { id: { in: ids }, accountId },
      select: { id: true, media: true },
    });
    const validIds = new Set(archived.map((a) => a.id));
    const ordered = ids.filter((id) => validIds.has(id));
    const cover = data.coverImage || archived[0]?.media || '';

    const highlight = await prisma.highlight.create({
      data: {
        accountId,
        name: (data.name || 'Highlight').slice(0, 100),
        coverImage: cover,
        order: count,
      },
    });

    for (let i = 0; i < ordered.length; i++) {
      await prisma.highlightItem.create({
        data: {
          highlightId: highlight.id,
          archivedStoryId: ordered[i],
          order: i,
        },
      });
    }

    return this.getById(accountId, highlight.id);
  }

  async update(accountId: string, highlightId: string, data: { name?: string; coverImage?: string }) {
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId, deletedAt: null } });
    if (!h) throw new AppError('Highlight not found', 404);
    await prisma.highlight.update({
      where: { id: highlightId },
      data: {
        ...(data.name != null && { name: data.name.slice(0, 100) }),
        ...(data.coverImage != null && { coverImage: data.coverImage }),
      },
    });
    return this.getById(accountId, highlightId);
  }

  async delete(accountId: string, highlightId: string) {
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId, deletedAt: null } });
    if (!h) throw new AppError('Highlight not found', 404);
    await prisma.highlight.update({
      where: { id: highlightId },
      data: { deletedAt: new Date(), deletedBy: accountId },
    });
    return { ok: true };
  }

  async addItem(accountId: string, highlightId: string, input: { archivedStoryId?: string; storyId?: string }) {
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId, deletedAt: null } });
    if (!h) throw new AppError('Highlight not found', 404);
    const archivedStoryId = typeof input.archivedStoryId === 'string' ? input.archivedStoryId.trim() : '';
    const storyId = typeof input.storyId === 'string' ? input.storyId.trim() : '';
    if (!archivedStoryId && !storyId) {
      throw new AppError('archivedStoryId or storyId is required', 400);
    }
    if (archivedStoryId) {
      const archived = await prisma.archivedStory.findFirst({
        where: { id: archivedStoryId, accountId },
      });
      if (!archived) throw new AppError('Archived story not found', 404);
    }
    if (storyId) {
      const liveStory = await prisma.story.findFirst({
        where: { id: storyId, accountId, deletedAt: null },
        select: { id: true },
      });
      if (!liveStory) throw new AppError('Story not found', 404);
    }
    const maxOrder = await prisma.highlightItem.findMany({
      where: { highlightId },
      orderBy: { order: 'desc' },
      take: 1,
    });
    const nextOrder = (maxOrder[0]?.order ?? -1) + 1;
    const count = await prisma.highlightItem.count({ where: { highlightId } });
    if (count >= MAX_ITEMS_PER_HIGHLIGHT) throw new AppError('Maximum items per highlight reached', 400);
    await prisma.highlightItem.create({
      data: {
        highlightId,
        archivedStoryId: archivedStoryId || null,
        storyId: storyId || null,
        order: nextOrder,
      },
    });
    return this.getById(accountId, highlightId);
  }

  async removeItem(accountId: string, highlightId: string, itemId: string) {
    const item = await prisma.highlightItem.findFirst({
      where: { id: itemId, highlight: { accountId } },
    });
    if (!item) throw new AppError('Item not found', 404);
    await prisma.highlightItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  async reorder(accountId: string, highlightId: string, itemIds: string[]) {
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId, deletedAt: null } });
    if (!h) throw new AppError('Highlight not found', 404);
    for (let i = 0; i < itemIds.length; i++) {
      await prisma.highlightItem.updateMany({
        where: { id: itemIds[i], highlightId },
        data: { order: i },
      });
    }
    return this.getById(accountId, highlightId);
  }
}
