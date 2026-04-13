import { prisma } from '../server';
import { getRetentionDays, SoftDeleteModel } from '../services/softDelete.service';

const purgeModels: SoftDeleteModel[] = [
  'post',
  'reel',
  'story',
  'comment',
  'note',
  'highlight',
  'collection',
  'anonymousPost',
  'live',
];

export async function purgeExpiredSoftDeleted(): Promise<Record<string, number>> {
  const now = Date.now();
  const summary: Record<string, number> = {};
  for (const model of purgeModels) {
    const retention = getRetentionDays(model);
    const cutoff = new Date(now - retention * 24 * 60 * 60 * 1000);
    const result = await (prisma as any)[model].deleteMany({
      where: { deletedAt: { not: null, lt: cutoff } },
    });
    summary[model] = result.count ?? 0;
  }

  // Messages are purged when:
  // - soft-deleted globally via deletedAt (future compatibility), OR
  // - both sender and receiver have deleted-for-me, and receiver-side deletion is expired.
  const messageCutoff = new Date(now - getRetentionDays('message') * 24 * 60 * 60 * 1000);
  const messageResult = await prisma.message.deleteMany({
    where: {
      OR: [
        { deletedAt: { not: null, lt: messageCutoff } },
        {
          deletedBySenderAt: { not: null },
          deletedByReceiverAt: { not: null, lt: messageCutoff },
        },
      ],
    },
  });
  summary.message = messageResult.count ?? 0;

  return summary;
}
