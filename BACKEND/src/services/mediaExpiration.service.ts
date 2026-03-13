import path from 'path';
import fs from 'fs';
import { Prisma } from '@prisma/client';
import { prisma } from '../server';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Resolve mediaKey (full URL or path like /uploads/filename) to local file path.
 * Returns null if not a local uploads path (e.g. external CDN/S3).
 */
function getLocalFilePath(mediaKey: string): string | null {
  if (!mediaKey || typeof mediaKey !== 'string') return null;
  const trimmed = mediaKey.trim();
  let pathname: string;
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const u = new URL(trimmed);
      pathname = u.pathname;
    } else if (trimmed.startsWith('/')) {
      pathname = trimmed;
    } else {
      return null;
    }
  } catch {
    return null;
  }
  const match = pathname.match(/^\/uploads\/([^/]+)$/);
  if (!match) return null;
  const filename = match[1];
  if (!filename || filename.includes('..')) return null;
  return path.join(UPLOADS_DIR, filename);
}

/**
 * Delete a local file if it exists. Swallows errors (e.g. already deleted, permission).
 */
function deleteLocalFileIfExists(filePath: string): void {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore
  }
}

/**
 * Track and clean up view‑once / temporary media for DMs.
 * Schedules expiration and, when due, clears the message and deletes the file from disk.
 */
export class MediaExpirationService {
  async schedule(messageId: string, mediaKey: string, deleteAt: Date) {
    await prisma.mediaExpiration.create({
      data: { messageId, mediaKey, deleteAt },
    });
  }

  /**
   * Process up to N due expirations: clear message media in DB and delete file from storage.
   * Returns the number of records successfully processed.
   */
  async processDue(now = new Date(), batchSize: number = 100): Promise<number> {
    const due = await prisma.mediaExpiration.findMany({
      where: { deleteAt: { lte: now } },
      take: batchSize,
    });
    if (!due.length) return 0;

    let count = 0;
    for (const row of due) {
      try {
        const localPath = getLocalFilePath(row.mediaKey);
        if (localPath) deleteLocalFileIfExists(localPath);

        await prisma.message.updateMany({
          where: { id: row.messageId },
          data: {
            media: Prisma.JsonNull,
            content: 'Media expired',
            isVanish: true,
          },
        });
        await prisma.mediaExpiration.delete({ where: { id: row.id } });
        count += 1;
      } catch {
        // keep the record so we can retry later
      }
    }
    return count;
  }
}

