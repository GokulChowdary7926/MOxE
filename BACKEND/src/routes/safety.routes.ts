import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { SafetyService } from '../services/safety.service';
import { prisma } from '../server';

const router = Router();
const safetyService = new SafetyService();

router.post('/sos', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = (req.body || {}) as { latitude?: number; longitude?: number };
    const result = await safetyService.triggerSOS(accountId, {
      latitude: body.latitude,
      longitude: body.longitude,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Hangout mode: start session or ping to extend. Body: { sessionId?, checkInInterval?, durationMinutes? } */
router.post('/hangout', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = (req.body || {}) as {
      sessionId?: string;
      checkInInterval?: number;
      durationMinutes?: number;
      latitude?: number;
      longitude?: number;
    };
    const checkInInterval = Math.min(15, Math.max(1, body.checkInInterval ?? 5));
    const durationMinutes = Math.min(120, Math.max(5, body.durationMinutes ?? 30));
    const now = new Date();
    const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    if (body.sessionId) {
      const session = await prisma.hangoutSession.findFirst({
        where: { id: body.sessionId, accountId },
      });
      if (session && session.status === 'ACTIVE') {
        await prisma.hangoutSession.update({
          where: { id: body.sessionId },
          data: { lastCheckIn: now },
        });
        return res.json({ ok: true, sessionId: body.sessionId, pinged: true });
      }
    }

    const session = await prisma.hangoutSession.create({
      data: {
        accountId,
        startedAt: now,
        endsAt,
        checkInInterval,
        lastCheckIn: now,
        status: 'ACTIVE',
      },
    });
    res.status(201).json({ ok: true, sessionId: session.id });
  } catch (e) {
    next(e);
  }
});

/** End an active hangout session. Body: { sessionId } */
router.patch('/hangout/end', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const sessionId = (req.body || {}).sessionId;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    await prisma.hangoutSession.updateMany({
      where: { id: sessionId, accountId },
      data: { status: 'COMPLETED' },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/hangout/:sessionId/status', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await safetyService.getHangoutStatus(accountId, req.params.sessionId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/hangout/:sessionId/escalate-overdue', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await safetyService.escalateOverdueHangout(accountId, req.params.sessionId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/hangout/escalate-overdue/all', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await safetyService.escalateAllOverdueHangouts(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
