/**
 * Content scheduling (Guide 3.7): publish posts and reels when scheduledFor <= now.
 * Run periodically (e.g. every minute via cron or internal job).
 */
import { prisma } from '../server';

export async function publishDueScheduledContent(): Promise<{ posts: number; reels: number }> {
  const now = new Date();
  const [postResult, reelResult] = await Promise.all([
    prisma.post.updateMany({
      where: { isScheduled: true, scheduledFor: { lte: now } },
      data: { isScheduled: false },
    }),
    prisma.reel.updateMany({
      where: { isScheduled: true, scheduledFor: { lte: now } },
      data: { isScheduled: false },
    }),
  ]);
  return { posts: postResult.count, reels: reelResult.count };
}
