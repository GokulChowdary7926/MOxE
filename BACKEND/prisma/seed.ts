import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { AccountType, SubscriptionTier } from '@prisma/client';

/**
 * Seeds deterministic E2E users for Playwright / manual QA only when explicitly allowed.
 * By default this script does nothing so `prisma db seed` does not recreate bot accounts in prod.
 *
 *   cd BACKEND && MOXE_ALLOW_E2E_SEED=1 npx prisma db seed
 *
 * Env:
 *   MOXE_ALLOW_E2E_SEED=1 — required to create accounts
 *   E2E_SEED_USERNAME / E2E_SEED_PASSWORD — PERSONAL account
 *   E2E_SEED_JOB_USERNAME — JOB account (default: playwright_job_e2e)
 *
 * Remove bot/demo data from DB: `npm run cleanup:bots` (dry run) or `npm run cleanup:bots:apply`.
 */
const prisma = new PrismaClient();

const USERNAME = (process.env.E2E_SEED_USERNAME || 'playwright_e2e').trim();
const JOB_USERNAME = (process.env.E2E_SEED_JOB_USERNAME || 'playwright_job_e2e').trim();
const PASSWORD = process.env.E2E_SEED_PASSWORD || 'Test123!';
const DISPLAY = process.env.E2E_SEED_DISPLAY || 'Playwright E2E';

async function ensureAccount(
  username: string,
  displayName: string,
  accountType: AccountType,
  subscriptionTier: SubscriptionTier = 'FREE',
): Promise<string> {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  const stablePhone = `+0seed_${username.replace(/\W/g, '_').slice(0, 20)}`;

  const existingAcc = await prisma.account.findUnique({
    where: { username },
    select: { id: true, userId: true },
  });

  if (existingAcc) {
    await prisma.user.update({
      where: { id: existingAcc.userId },
      data: { password: hashedPassword },
    });
    await prisma.account.update({
      where: { id: existingAcc.id },
      data: { accountType, subscriptionTier },
    });
    return existingAcc.id;
  }

  const user = await prisma.user.create({
    data: {
      phoneNumber: stablePhone,
      password: hashedPassword,
      dateOfBirth: new Date('2000-01-01'),
      accounts: {
        create: {
          username,
          displayName,
          accountType,
          subscriptionTier,
          isActive: true,
        },
      },
    },
    include: {
      accounts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'asc' } },
    },
  });
  const acc = user.accounts[0];
  if (!acc) throw new Error(`Seed: account not created for ${username}`);
  return acc.id;
}

async function main() {
  if ((process.env.MOXE_ALLOW_E2E_SEED ?? '').trim() !== '1') {
    console.log(
      '[seed] Skipped: set MOXE_ALLOW_E2E_SEED=1 to create Playwright E2E accounts. ' +
        'Purge bot data: npm run cleanup:bots (preview) or npm run cleanup:bots:apply.',
    );
    return;
  }

  if (USERNAME.length < 3) {
    throw new Error('E2E_SEED_USERNAME must be at least 3 characters');
  }
  if (PASSWORD.length < 6) {
    throw new Error('E2E_SEED_PASSWORD must be at least 6 characters');
  }

  await ensureAccount(USERNAME, DISPLAY, 'PERSONAL');

  if (JOB_USERNAME.length >= 3) {
    // THICK tier → hasJobTools in API (see BACKEND/src/constants/tierCapabilities.ts JOB_PAID)
    await ensureAccount(JOB_USERNAME, 'Playwright Job E2E', 'JOB', 'THICK');
  }

  console.log(
    `[seed] PERSONAL: "${USERNAME}"; JOB: "${JOB_USERNAME}" THICK + job tools (same password). No demo posts.`,
  );
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
