/**
 * Draft service: list, create, update, delete, get by id.
 * Drafts expire after expiresAt (e.g. 30 days).
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const DEFAULT_EXPIRY_DAYS = 30;

export type DraftItem = {
  id: string;
  type: string;
  content: unknown;
  media: unknown;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export class DraftService {
  async list(accountId: string): Promise<DraftItem[]> {
    const drafts = await prisma.draft.findMany({
      where: { accountId, expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: 'desc' },
    });
    return drafts.map((d) => ({
      id: d.id,
      type: d.type,
      content: d.content as unknown,
      media: d.media as unknown,
      expiresAt: d.expiresAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  async get(accountId: string, draftId: string): Promise<DraftItem> {
    const d = await prisma.draft.findFirst({
      where: { id: draftId, accountId },
    });
    if (!d) throw new AppError('Draft not found', 404);
    return {
      id: d.id,
      type: d.type,
      content: d.content as unknown,
      media: d.media as unknown,
      expiresAt: d.expiresAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }

  async create(accountId: string, type: string, content: unknown, media?: unknown): Promise<DraftItem> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);
    const d = await prisma.draft.create({
      data: {
        accountId,
        type: type.toUpperCase().slice(0, 20),
        content: (content ?? {}) as Prisma.InputJsonValue,
        media: media == null ? Prisma.JsonNull : (media as Prisma.InputJsonValue),
        expiresAt,
      },
    });
    return this.get(accountId, d.id);
  }

  async update(accountId: string, draftId: string, content?: unknown, media?: unknown): Promise<DraftItem> {
    const d = await prisma.draft.findFirst({
      where: { id: draftId, accountId },
    });
    if (!d) throw new AppError('Draft not found', 404);
    await prisma.draft.update({
      where: { id: draftId },
      data: {
        ...(content !== undefined && { content: content as Prisma.InputJsonValue }),
        ...(media !== undefined && { media: media === null ? Prisma.JsonNull : (media as Prisma.InputJsonValue) }),
      },
    });
    return this.get(accountId, draftId);
  }

  async delete(accountId: string, draftId: string): Promise<{ ok: boolean }> {
    const d = await prisma.draft.findFirst({
      where: { id: draftId, accountId },
    });
    if (!d) throw new AppError('Draft not found', 404);
    await prisma.draft.delete({ where: { id: draftId } });
    return { ok: true };
  }
}
