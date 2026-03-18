import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

// Simple liveness probe
router.get('/live', (_req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness: check database; treat other deps as best-effort in future
router.get('/ready', async (_req, res) => {
  const startedAt = Date.now();
  const checks: { database: boolean } = { database: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const allHealthy = checks.database;
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'degraded',
    checks,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
});

export default router;

