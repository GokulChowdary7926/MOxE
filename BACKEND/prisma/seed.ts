import { PrismaClient } from '@prisma/client';

/**
 * Prisma seed script for MOxE.
 *
 * This keeps it intentionally minimal:
 * - Verifies the database connection
 * - Leaves business/domain data seeding to future, explicit scripts
 *
 * Run with:
 *   cd BACKEND && npx prisma db seed
 */
const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting MOxE seed (no-op data seed).');
  // Add initial data here in the future (feature flags, config rows, etc.).
  await prisma.$queryRaw`SELECT 1`;
  console.log('[seed] Database connectivity verified.');
}

main()
  .catch((e) => {
    console.error('[seed] Error during seed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('[seed] Finished.');
  });

