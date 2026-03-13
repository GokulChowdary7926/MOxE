import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { GroupService } from '../services/group.service';

const router = Router();
const groupService = new GroupService();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const groups = await groupService.list(accountId);
    res.json({ groups });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const group = await groupService.getById(accountId, req.params.id);
    res.json(group);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { name?: string; photo?: string; participantIds?: string[] };
    const group = await groupService.create(accountId, {
      name: body.name || 'Group',
      photo: body.photo,
      participantIds: body.participantIds || [],
    });
    res.status(201).json(group);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { name?: string; photo?: string };
    const group = await groupService.update(accountId, req.params.id, body);
    res.json(group);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await groupService.delete(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/members', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const participantIds = Array.isArray(req.body.participantIds) ? req.body.participantIds : [req.body.userId].filter(Boolean);
    const group = await groupService.addMembers(accountId, req.params.id, participantIds);
    res.json(group);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await groupService.removeMember(accountId, req.params.id, req.params.userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/members/:userId/role', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const isAdmin = req.body.role === 'ADMIN';
    const group = await groupService.setAdmin(accountId, req.params.id, req.params.userId, isAdmin);
    res.json(group);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/leave', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await groupService.leave(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
