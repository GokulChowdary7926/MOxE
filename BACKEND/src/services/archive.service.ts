import { prisma } from '../server';
import { normalizeStoredMediaUrl } from '../utils/mediaUrl';

export class ArchiveService {
  async runArchiveJob(): Promise<{ archived: number }> {
    const now = new Date();
    const accountsWithArchive = await prisma.account.findMany({
      where: { storyArchiveEnabled: true },
      select: { id: true },
    });
    const accountIds = new Set(accountsWithArchive.map((a) => a.id));

    const expired = await prisma.story.findMany({
      where: {
        expiresAt: { lt: now },
        accountId: { in: Array.from(accountIds) },
      },
      orderBy: { createdAt: 'asc' },
    });

    let archived = 0;
    for (const story of expired) {
      const existing = await prisma.archivedStory.findFirst({
        where: { storyId: story.id },
      });
      if (existing) continue;

      await prisma.archivedStory.create({
        data: {
          accountId: story.accountId,
          media: story.media,
          type: story.type,
          storyId: story.id,
          metadata: {
            stickers: story.stickers,
            textOverlay: story.textOverlay,
            allowReplies: story.allowReplies,
            allowReshares: story.allowReshares,
          } as object,
        },
      });
      archived++;
    }
    return { archived };
  }

  async getArchive(accountId: string) {
    const items = await prisma.archivedStory.findMany({
      where: { accountId },
      orderBy: { archivedAt: 'desc' },
    });
    return {
      items: await Promise.all(
        items.map(async (item) => ({
          ...item,
          media:
            typeof item.media === 'string' ? await normalizeStoredMediaUrl(item.media) : item.media,
        })),
      ),
    };
  }
}
