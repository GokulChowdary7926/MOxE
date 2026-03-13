import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { EmergencyContactService } from '../services/emergencyContact.service';

const router = Router();
const service = new EmergencyContactService();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await service.list(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { contactId, relationship, isPrimary } = req.body;
    if (!contactId) return res.status(400).json({ error: 'contactId required' });
    const item = await service.add(accountId, contactId, relationship ?? 'Contact', !!isPrimary);
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await service.remove(accountId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/primary', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const item = await service.setPrimary(accountId, req.params.id);
    res.json(item);
  } catch (e) {
    next(e);
  }
});

export default router;
