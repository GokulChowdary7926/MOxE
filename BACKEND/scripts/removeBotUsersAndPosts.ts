/**
 * Purge demo / E2E “bot” accounts and bot-tagged content from the database.
 *
 * Default: DRY RUN (no writes). To apply:
 *   cd BACKEND && DRY_RUN=false npm run cleanup:bots:apply
 *
 * Hard-delete accounts (may fail if FKs remain; falls back to soft-delete per account):
 *   DRY_RUN=false HARD_DELETE_ACCOUNTS=true npm run cleanup:bots:apply
 *
 * Extra usernames: MOXE_EXTRA_BOT_USERNAMES=foo,bar
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Legacy demo handles from old mock datasets. */
const LEGACY_DEMO_USERNAMES = [
  'moxe.creator',
  'urban.explorer',
  'coffee.and.code',
  'travel.with.ana',
  'night.runner',
  'jordan.creates',
  'alex.travels',
  'sam.kitchen',
  'morgan.fitness',
  'riley.photo',
  'casey.reads',
  'quinn.music',
  'taylor.tech',
  'jesse.art',
  'drew.fashion',
  'skyler.yoga',
  'cameron.gaming',
  'reese.bakery',
  'avery.writes',
  'parker.outdoors',
];

const DRY_RUN = process.env.DRY_RUN !== 'false';
const HARD_DELETE_ACCOUNTS = process.env.HARD_DELETE_ACCOUNTS === 'true';

function makeDeletedUsername(username: string, id: string): string {
  const suffix = id.slice(-6);
  const base = `deleted_${username.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 16)}`;
  return `${base}_${suffix}`;
}

function extraNamesFromEnv(): string[] {
  return (process.env.MOXE_EXTRA_BOT_USERNAMES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function collectBotAccounts(): Promise<{ id: string; username: string; displayName: string }[]> {
  const e2ePersonal = (process.env.E2E_SEED_USERNAME || 'playwright_e2e').trim();
  const e2eJob = (process.env.E2E_SEED_JOB_USERNAME || 'playwright_job_e2e').trim();

  const usernameList = [...new Set([...LEGACY_DEMO_USERNAMES, e2ePersonal, e2eJob, ...extraNamesFromEnv()])];

  const found = await prisma.account.findMany({
    where: {
      OR: [
        { username: { in: usernameList } },
        { username: { startsWith: 'playwright_', mode: 'insensitive' } },
        { username: { endsWith: '_e2e', mode: 'insensitive' } },
        { displayName: { in: ['Playwright E2E', 'Playwright Job E2E', '[Deleted Bot Account]'] } },
        { user: { phoneNumber: { startsWith: '+0seed_' } } },
      ],
    },
    select: { id: true, username: true, displayName: true },
  });

  const byId = new Map(found.map((a) => [a.id, a]));
  return Array.from(byId.values());
}

async function postIdsMatchingCaptionBots(): Promise<string[]> {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { caption: { contains: 'botseed', mode: 'insensitive' } },
        { caption: { contains: '(seed)', mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });
  return posts.map((p) => p.id);
}

async function deletePostRelations(postIds: string[]): Promise<void> {
  if (!postIds.length) return;
  await prisma.like.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.comment.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.view.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.share.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.tag.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.mention.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.savedPost.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.postHashtag.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.feedInteraction.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.adCampaign.deleteMany({ where: { postId: { in: postIds } } });
}

async function deletePostsByCaptionPatterns(): Promise<number> {
  const ids = await postIdsMatchingCaptionBots();
  if (!ids.length) return 0;
  await deletePostRelations(ids);
  const r = await prisma.post.deleteMany({ where: { id: { in: ids } } });
  return r.count;
}

async function deleteContentForAccounts(accountIds: string[]): Promise<void> {
  if (!accountIds.length) return;

  const posts = await prisma.post.findMany({
    where: { accountId: { in: accountIds } },
    select: { id: true },
  });
  const postIds = posts.map((p) => p.id);
  await deletePostRelations(postIds);

  await prisma.post.deleteMany({ where: { accountId: { in: accountIds } } });
  await prisma.story.deleteMany({ where: { accountId: { in: accountIds } } });
  await prisma.reel.deleteMany({ where: { accountId: { in: accountIds } } });
  await prisma.live.deleteMany({ where: { accountId: { in: accountIds } } });
}

async function purgeOrphanSeedUsers(): Promise<number> {
  const orphans = await prisma.user.findMany({
    where: {
      phoneNumber: { startsWith: '+0seed_' },
      accounts: { none: {} },
    },
    select: { id: true },
  });
  let n = 0;
  for (const u of orphans) {
    try {
      await prisma.user.delete({ where: { id: u.id } });
      n += 1;
    } catch {
      // ignore
    }
  }
  return n;
}

async function main() {
  if (DRY_RUN) {
    const captionWould = (await postIdsMatchingCaptionBots()).length;
    if (captionWould) console.log('[cleanup:bots] Would delete posts (botseed / (seed) captions):', captionWould);
  } else {
    const captionRemoved = await deletePostsByCaptionPatterns();
    if (captionRemoved > 0) {
      console.log('[cleanup:bots] Posts removed (botseed / (seed) captions):', captionRemoved);
    }
  }

  const botAccounts = await collectBotAccounts();

  if (botAccounts.length === 0) {
    console.log('[cleanup:bots] No matching bot/demo/E2E-pattern accounts found.');
    return;
  }

  const accountIds = botAccounts.map((a) => a.id);
  const postsCount = await prisma.post.count({ where: { accountId: { in: accountIds } } });
  const storiesCount = await prisma.story.count({ where: { accountId: { in: accountIds } } });
  const reelsCount = await prisma.reel.count({ where: { accountId: { in: accountIds } } });
  const livesCount = await prisma.live.count({ where: { accountId: { in: accountIds } } });

  console.log('[cleanup:bots] Target accounts:', botAccounts.map((a) => `${a.username} (${a.displayName})`).join(', '));
  console.log('[cleanup:bots] Found:', {
    accounts: botAccounts.length,
    posts: postsCount,
    stories: storiesCount,
    reels: reelsCount,
    lives: livesCount,
  });

  if (DRY_RUN) {
    console.log('[cleanup:bots] DRY_RUN=true (default). No account changes were written.');
    console.log('[cleanup:bots] Run: npm run cleanup:bots:apply');
    return;
  }

  await deleteContentForAccounts(accountIds);

  if (HARD_DELETE_ACCOUNTS) {
    console.log('[cleanup:bots] HARD_DELETE_ACCOUNTS=true, attempting account deletion...');
    for (const account of botAccounts) {
      try {
        await prisma.account.delete({ where: { id: account.id } });
        console.log(`[cleanup:bots] Deleted account ${account.username}`);
      } catch (err) {
        console.warn(
          `[cleanup:bots] Could not hard-delete ${account.username}; applying soft-delete fallback.`,
          err instanceof Error ? err.message : err,
        );
        await prisma.account.update({
          where: { id: account.id },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            displayName: '[Deleted Bot Account]',
            bio: null,
            profilePhoto: null,
            username: makeDeletedUsername(account.username, account.id),
          },
        });
      }
    }
    const orphansRemoved = await purgeOrphanSeedUsers();
    if (orphansRemoved) console.log('[cleanup:bots] Orphan +0seed_ users removed:', orphansRemoved);
  } else {
    console.log('[cleanup:bots] Applying soft-delete to bot/demo accounts...');
    for (const account of botAccounts) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          displayName: '[Deleted Bot Account]',
          bio: null,
          profilePhoto: null,
          username: makeDeletedUsername(account.username, account.id),
        },
      });
    }
  }

  console.log('[cleanup:bots] Completed.');
}

main()
  .catch((e) => {
    console.error('[cleanup:bots] Failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
