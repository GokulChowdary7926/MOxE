import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { MessageService } from '../services/message.service';
import { PrivacyService } from '../services/privacy.service';
import { ReportService } from '../services/report.service';

const router = Router();
const messageService = new MessageService();
const privacyService = new PrivacyService();
const reportService = new ReportService();

router.use(authenticate);

/** List message requests (non‑followers DM requests). */
router.get('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { requests } = await messageService.getThreads(accountId);
    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

/** Accept: move request into main inbox (mark as accepted). */
router.post('/:otherAccountId/accept', async (req, res, next) => {
  try {
    const me = (req as any).user?.accountId as string | undefined;
    const other = req.params.otherAccountId;
    if (!me || !other) return res.status(400).json({ error: 'Invalid ids' });

    await messageService.acceptRequest(me, other);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Decline: hide the request thread but do not block. */
router.post('/:otherAccountId/decline', async (req, res, next) => {
  try {
    const me = (req as any).user?.accountId as string | undefined;
    const other = req.params.otherAccountId;
    if (!me || !other) return res.status(400).json({ error: 'Invalid ids' });

    await messageService.declineRequest(me, other);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Block from request. */
router.post('/:otherAccountId/block', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    const otherId = req.params.otherAccountId;
    if (!accountId || !otherId) return res.status(400).json({ error: 'Invalid ids' });

    await privacyService.block(accountId, otherId, true);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Report a message request. */
router.post('/:otherAccountId/report', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    const otherId = req.params.otherAccountId;
    const reason = String(req.body?.reason || 'DM request');
    if (!accountId || !otherId) return res.status(400).json({ error: 'Invalid ids' });

    await reportService.create(accountId, {
      type: 'account',
      targetId: otherId,
      reason,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

