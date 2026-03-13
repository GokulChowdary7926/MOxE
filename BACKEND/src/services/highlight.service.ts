/**
 * Highlights: create from archived stories, CRUD, add/remove items.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const MAX_ITEMS_PER_HIGHLIGHT = 100;
const MAX_HIGHLIGHTS = 50;

export class HighlightService {
  async list(accountId: string) {
    const list = await prisma.highlight.findMany({
      where: { accountId },
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
    return list;
  }

  async getById(accountId: string, highlightId: string) {
    const h = await prisma.highlight.findFirst({
      where: { id: highlightId, accountId },
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
    return h;
  }

  /** Public: get any highlight by id (for viewing on profile). */
  async getByIdPublic(highlightId: string) {
    const h = await prisma.highlight.findFirst({
      where: { id: highlightId },
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
    return h;
  }

  async create(accountId: string, data: { name: string; coverImage?: string; archivedStoryIds: string[] }) {
    const count = await prisma.highlight.count({ where: { accountId } });
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
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId } });
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
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId } });
    if (!h) throw new AppError('Highlight not found', 404);
    await prisma.highlight.delete({ where: { id: highlightId } });
    return { ok: true };
  }

  async addItem(accountId: string, highlightId: string, archivedStoryId: string) {
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId } });
    if (!h) throw new AppError('Highlight not found', 404);
    const archived = await prisma.archivedStory.findFirst({
      where: { id: archivedStoryId, accountId },
    });
    if (!archived) throw new AppError('Archived story not found', 404);
    const maxOrder = await prisma.highlightItem.findMany({
      where: { highlightId },
      orderBy: { order: 'desc' },
      take: 1,
    });
    const nextOrder = (maxOrder[0]?.order ?? -1) + 1;
    const count = await prisma.highlightItem.count({ where: { highlightId } });
    if (count >= MAX_ITEMS_PER_HIGHLIGHT) throw new AppError('Maximum items per highlight reached', 400);
    await prisma.highlightItem.create({
      data: { highlightId, archivedStoryId, order: nextOrder },
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
    const h = await prisma.highlight.findFirst({ where: { id: highlightId, accountId } });
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
