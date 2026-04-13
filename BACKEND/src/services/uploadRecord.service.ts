import { prisma } from '../server';
import { deleteStoredObject, type StorageBackend } from './storage.service';
import { AppError } from '../utils/AppError';

export type UploadPurpose = 'general' | 'track' | 'batch';

/**
 * Persist metadata for a stored object (local uploads/ or S3). Best-effort: callers may catch/log.
 */
export async function recordUploadedAsset(params: {
  accountId: string;
  storageKey: string;
  publicUrl: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  purpose: UploadPurpose;
  storageBackend: StorageBackend;
}) {
  return prisma.uploadedAsset.create({
    data: {
      accountId: params.accountId,
      storageKey: params.storageKey,
      publicUrl: params.publicUrl,
      originalFileName: params.originalFileName.slice(0, 500),
      mimeType: params.mimeType.slice(0, 200),
      sizeBytes: params.sizeBytes,
      purpose: params.purpose,
      storageBackend: params.storageBackend,
    },
  });
}

export async function listUploadedAssets(
  accountId: string,
  query: { limit?: number; offset?: number },
) {
  const limit = Math.min(Math.max(query.limit ?? 40, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);
  const [items, total] = await prisma.$transaction([
    prisma.uploadedAsset.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        storageKey: true,
        publicUrl: true,
        originalFileName: true,
        mimeType: true,
        sizeBytes: true,
        purpose: true,
        storageBackend: true,
        createdAt: true,
      },
    }),
    prisma.uploadedAsset.count({ where: { accountId } }),
  ]);
  return {
    items,
    total,
    hasMore: offset + items.length < total,
    limit,
    offset,
  };
}

/**
 * Remove blob (disk or S3), DB row, and subtract from account storage quota. Data stays until this runs.
 */
export async function deleteUploadedAssetForAccount(uploadId: string, accountId: string): Promise<void> {
  const row = await prisma.uploadedAsset.findFirst({
    where: { id: uploadId, accountId },
  });
  if (!row) throw new AppError('Upload not found', 404);
  const backend: StorageBackend = row.storageBackend === 's3' ? 's3' : 'local';
  await deleteStoredObject(row.storageKey, backend);
  await prisma.$transaction(async (tx) => {
    await tx.uploadedAsset.delete({ where: { id: row.id } });
    const acc = await tx.account.findUnique({
      where: { id: accountId },
      select: { storageBytesUsed: true },
    });
    const next = Math.max(0, (acc?.storageBytesUsed ?? 0) - row.sizeBytes);
    await tx.account.update({
      where: { id: accountId },
      data: { storageBytesUsed: next },
    });
  });
}
