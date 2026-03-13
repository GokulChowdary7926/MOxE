import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { reviewVerificationRequest } from '../services/verification.service';
import { AppError } from '../utils/AppError';

const router = Router();

function requireAdmin(req: any, _res: any, next: (err?: any) => void) {
  const adminIds = (process.env.ADMIN_ACCOUNT_IDS || '').trim().split(',').filter(Boolean);
  const accountId = req.user?.accountId || req.user?.userId;
  if (adminIds.length > 0 && accountId && !adminIds.includes(accountId)) {
    return next(new AppError('Forbidden', 403));
  }
  next();
}

router.get('/', (_req, res) => res.json({ service: 'admin' }));

/** List pending verification requests (for admin UI). */
router.get('/verification-requests', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { prisma } = await import('../server');
    const list = await prisma.verificationRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { account: { select: { id: true, username: true, displayName: true, accountType: true, subscriptionTier: true } } },
    });
    res.json({ requests: list });
  } catch (e) {
    next(e);
  }
});

/** Approve or reject a verification request. Blue Badge only granted when subscriptionTier is STAR or THICK. */
router.patch('/verification-requests/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = req.body?.status as string;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return next(new AppError('status must be APPROVED or REJECTED', 400));
    }
    const result = await reviewVerificationRequest(req.params.id, status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
