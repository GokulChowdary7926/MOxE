import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AccountService } from '../services/account.service';

const router = Router();
const accountService = new AccountService();

router.get('/', (_req, res) => res.json({ service: 'user' }));

/** Alias for GET /accounts/me — same JSON { account, capabilities }. */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const bundle = await accountService.getMeBundle(accountId);
    res.json(bundle);
  } catch (e) {
    next(e);
  }
});

export default router;
