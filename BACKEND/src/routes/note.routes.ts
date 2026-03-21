import { Router } from 'express';
import { NoteType } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { NoteService } from '../services/note.service';
import { AppError } from '../utils/AppError';
import { prisma } from '../server';
import { emitNoteCreated, emitNoteDeleted, emitNotesRefresh } from '../sockets';

const router = Router();
const service = new NoteService();

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, accountType: true, subscriptionTier: true },
    });
    if (!account) throw new AppError('Account not found', 404);

    const rawType = typeof req.body?.type === 'string' ? req.body.type.toUpperCase() : 'TEXT';
    const type = (Object.values(NoteType) as string[]).includes(rawType) ? (rawType as NoteType) : 'TEXT';
    const content = (req.body?.content ?? {}) as Record<string, unknown>;
    if (type === 'TEXT' && typeof content.text !== 'string') {
      throw new AppError('content.text is required for text notes', 400);
    }

    const note = await service.createNote({
      accountId: account.id,
      accountType: account.accountType,
      tier: account.subscriptionTier,
      type,
      content,
      appearance: (req.body?.appearance ?? null) as Record<string, unknown> | null,
      audience: (req.body?.audience ?? { type: 'mutual' }) as { type?: string },
      scheduleAt: req.body?.scheduleAt ? new Date(req.body.scheduleAt) : undefined,
    });
    emitNoteCreated(note);
    res.status(201).json(note);
  } catch (e) {
    next(e);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const notes = await service.listVisibleNotes(accountId);
    res.json(notes);
  } catch (e) {
    next(e);
  }
});

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const note = await service.getMyActiveNote(accountId);
    res.json({ hasNote: !!note, note: note ?? null });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    await service.deleteNote(req.params.id, accountId);
    emitNoteDeleted(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    await service.likeNote(req.params.id, accountId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/poll', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const option = typeof req.body?.option === 'string' ? req.body.option.trim() : '';
    if (!option) throw new AppError('option is required', 400);
    await service.votePoll(req.params.id, accountId, option);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/analytics', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const analytics = await service.getAnalytics(req.params.id, accountId);
    res.json(analytics);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/schedule', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const publishAt = req.body?.publishAt ? new Date(req.body.publishAt) : null;
    if (!publishAt || Number.isNaN(publishAt.getTime())) throw new AppError('Valid publishAt is required', 400);
    await service.scheduleNote(req.params.id, accountId, publishAt);
    emitNotesRefresh();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
