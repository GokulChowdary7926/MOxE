import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type SoftDeleteModel =
  | 'post'
  | 'reel'
  | 'story'
  | 'comment'
  | 'note'
  | 'highlight'
  | 'collection'
  | 'anonymousPost'
  | 'live'
  | 'message';

const retentionDays: Record<SoftDeleteModel, number> = {
  post: 30,
  reel: 30,
  story: 30,
  comment: 30,
  note: 30,
  highlight: 30,
  collection: 30,
  anonymousPost: 30,
  live: 30,
  message: 30,
};

const ownerFieldByModel: Record<SoftDeleteModel, string> = {
  post: 'accountId',
  reel: 'accountId',
  story: 'accountId',
  comment: 'accountId',
  note: 'accountId',
  highlight: 'accountId',
  collection: 'accountId',
  anonymousPost: 'accountId',
  live: 'accountId',
  message: 'senderId',
};

export function getRetentionDays(model: SoftDeleteModel): number {
  return retentionDays[model] ?? 30;
}

async function assertOwnership(model: SoftDeleteModel, id: string, accountId: string): Promise<void> {
  const ownerField = ownerFieldByModel[model];
  const item = await (prisma as any)[model].findUnique({
    where: { id },
    select: { [ownerField]: true },
  });
  if (!item || item[ownerField] !== accountId) {
    throw new AppError('Not found', 404);
  }
}

export async function softDelete(model: SoftDeleteModel, id: string, accountId: string) {
  await assertOwnership(model, id, accountId);
  return (prisma as any)[model].update({
    where: { id },
    data: { deletedAt: new Date(), deletedBy: accountId },
  });
}

export async function restore(model: SoftDeleteModel, id: string, accountId: string) {
  await assertOwnership(model, id, accountId);
  return (prisma as any)[model].update({
    where: { id },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function permanentDelete(model: SoftDeleteModel, id: string, accountId: string) {
  await assertOwnership(model, id, accountId);
  return (prisma as any)[model].delete({ where: { id } });
}

export async function listRecentlyDeleted(accountId: string, limit = 200) {
  const models: SoftDeleteModel[] = [
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
  const raw: Array<Record<string, unknown>> = [];
  for (const model of models) {
    const ownerField = ownerFieldByModel[model];
    const items = await (prisma as any)[model].findMany({
      where: { deletedAt: { not: null }, [ownerField]: accountId },
      orderBy: { deletedAt: 'desc' },
      take: Math.max(20, Math.floor(limit / models.length)),
    });
    raw.push(
      ...items.map((item: Record<string, unknown>) => ({
        ...item,
        __type: model,
        retentionDays: getRetentionDays(model),
      })),
    );
  }
  raw.sort((a, b) => {
    const at = new Date(String(a.deletedAt ?? 0)).getTime();
    const bt = new Date(String(b.deletedAt ?? 0)).getTime();
    return bt - at;
  });
  return { items: raw.slice(0, limit) };
}
