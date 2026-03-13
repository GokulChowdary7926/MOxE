import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ArchiveService } from '../services/archive.service';

const router = Router();
const archiveService = new ArchiveService();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await archiveService.getArchive(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Run archive job (copy expired stories to ArchivedStory). Call from cron every hour: set CRON_SECRET and send header X-Cron-Secret. */
router.post('/run-job', (req, res, next) => {
  const cronKey = process.env.CRON_SECRET || process.env.INTERNAL_API_KEY;
  const secret = (req.headers['x-cron-secret'] as string) || req.body?.secret;
  if (cronKey) {
    if (secret !== cronKey) return res.status(403).json({ error: 'Forbidden' });
  } else {
    return authenticate(req, res, next);
  }
  next();
}, async (req, res, next) => {
  try {
    const result = await archiveService.runArchiveJob();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
