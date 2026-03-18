import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { SupportService } from '../services/support.service';

const router = Router();
const supportService = new SupportService();

router.post('/tickets', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { subject, message, category } = req.body;
    const ticket = await supportService.createTicket(accountId, { subject: subject || 'Support', message: message || '', category });
    res.status(201).json(ticket);
  } catch (e) {
    next(e);
  }
});

router.get('/tickets', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const queue = (req.query.queue as string) === 'true';
    const tickets = queue
      ? await supportService.listQueue(accountId)
      : await supportService.listMyTickets(accountId);
    res.json({ tickets: Array.isArray(tickets) ? tickets : [tickets] });
  } catch (e) {
    next(e);
  }
});

router.get('/tickets/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const ticket = await supportService.getTicketById(accountId, req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (e) {
    next(e);
  }
});

router.post('/tickets/:id/reply', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const message = req.body?.message ?? '';
    const reply = await supportService.addReply(accountId, req.params.id, message);
    res.status(201).json(reply);
  } catch (e) {
    next(e);
  }
});

export default router;
