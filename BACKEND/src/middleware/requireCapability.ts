import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/account.service';

const accountService = new AccountService();

type CapabilityKey = 'canTrack' | 'canKnow' | 'canFlow' | 'canWork' | 'canCommerce' | 'canLive' | 'canSchedulePosts';

export function requireCapability(feature: CapabilityKey) {
  return async (req: Request & { user?: { userId?: string; accountId?: string } }, res: Response, next: NextFunction) => {
    try {
      const accountId = req.user?.accountId || req.user?.userId;
      if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
      await accountService.requireCapability(accountId, feature);
      next();
    } catch (e) {
      next(e);
    }
  };
}
