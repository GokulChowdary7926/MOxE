/**
 * Subscription plans and upgrade API.
 * GET /api/subscription/plans - list all plans with pricing and features
 * POST /api/subscription/upgrade - upgrade to target tier (body: { targetTier })
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AccountService } from '../services/account.service';
import { getEffectiveTierKey, TIER_CAPABILITIES, type EffectiveTierKey } from '../constants/tierCapabilities';
import type { AccountType, SubscriptionTier } from '../constants/capabilities';

const router = Router();
const accountService = new AccountService();

const PLANS: Array<{
  tier: EffectiveTierKey | string;
  name: string;
  accountType: AccountType;
  price: number;
  interval: string;
  annualPrice?: number;
  features: Record<string, unknown>;
}> = [
  {
    tier: 'PERSONAL_FREE',
    name: 'Personal Free',
    accountType: 'PERSONAL',
    price: 0,
    interval: 'month',
    features: { storage: '1 GB', ads: true, profileVisitors: false, anonymousStoryViews: 0, downloadProtection: false, voiceCommands: 'none' },
  },
  {
    tier: 'PERSONAL_STAR',
    name: 'Personal Star',
    accountType: 'PERSONAL',
    price: 1,
    interval: 'month',
    annualPrice: 11,
    features: { storage: '5 GB', ads: false, profileVisitors: true, anonymousStoryViews: 2, downloadProtection: true, voiceCommands: 'basic', messageBlockedUser: 1 },
  },
  {
    tier: 'BUSINESS_FREE',
    name: 'Business Free',
    accountType: 'BUSINESS',
    price: 0,
    interval: 'month',
    features: { storage: '1 GB', ads: true, maxProducts: 50, blueBadge: false, analytics: 'basic', scheduling: false, liveShopping: false },
  },
  {
    tier: 'BUSINESS_PAID',
    name: 'Business Paid',
    accountType: 'BUSINESS',
    price: 5,
    interval: 'month',
    annualPrice: 55,
    features: { storage: '5 GB', ads: false, maxProducts: 'unlimited', blueBadge: true, analytics: 'advanced', scheduling: true, liveShopping: true, teamManagement: 5 },
  },
  {
    tier: 'CREATOR_FREE',
    name: 'Creator Free',
    accountType: 'CREATOR',
    price: 0,
    interval: 'month',
    features: { storage: '1 GB', ads: true, blueBadge: false, subscriptions: false, badges: false, gifts: false, brandedContent: false },
  },
  {
    tier: 'CREATOR_PAID',
    name: 'Creator Paid',
    accountType: 'CREATOR',
    price: 5,
    interval: 'month',
    annualPrice: 55,
    features: { storage: '5 GB', ads: false, blueBadge: true, subscriptions: true, badges: true, gifts: true, brandedContent: true, marketplace: true },
  },
  {
    tier: 'JOB_FREE',
    name: 'Job (Free)',
    accountType: 'JOB',
    price: 0,
    interval: 'month',
    features: { storage: '1 GB', purpleBadge: false, professionalTools: 0 },
  },
  {
    tier: 'JOB_PAID',
    name: 'Job Professional',
    accountType: 'JOB',
    price: 10,
    interval: 'month',
    annualPrice: 110,
    features: { storage: '10 GB', ads: false, purpleBadge: true, professionalTools: 24, teamManagement: true, voiceCommands: 'advanced' },
  },
];

/** GET /api/subscription/plans - list all plans */
router.get('/plans', (_req, res) => {
  res.json(PLANS);
});

/** Map effective tier to Prisma tier for upgrade */
function targetTierToPrismaTier(targetTier: string, accountType: AccountType): SubscriptionTier | null {
  switch (targetTier) {
    case 'PERSONAL_STAR':
      return accountType === 'PERSONAL' ? 'STAR' : null;
    case 'BUSINESS_PAID':
      return accountType === 'BUSINESS' ? 'THICK' : null;
    case 'CREATOR_PAID':
      return accountType === 'CREATOR' ? 'THICK' : null;
    case 'JOB_PAID':
      return accountType === 'JOB' ? 'THICK' : null;
    default:
      return null;
  }
}

/** POST /api/subscription/upgrade - upgrade to target tier */
router.post('/upgrade', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { targetTier } = req.body ?? {};
    if (!targetTier || typeof targetTier !== 'string') {
      return res.status(400).json({ error: 'targetTier required' });
    }
    const validKeys = Object.keys(TIER_CAPABILITIES) as EffectiveTierKey[];
    if (!validKeys.includes(targetTier as EffectiveTierKey)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    if (targetTier === 'JOB_PAID') {
      const account = await accountService.getAccountById(accountId);
      if ((account as any).accountType !== 'JOB') {
        return res.status(400).json({
          error: 'Job tier requires Job account type. Please switch to Job account first.',
        });
      }
    }
    const account = await accountService.getAccountById(accountId);
    const at = (account as any).accountType as AccountType;
    const prismaTier = targetTierToPrismaTier(targetTier, at);
    if (!prismaTier) {
      return res.status(400).json({
        error: `Tier ${targetTier} is not valid for ${at} account.`,
      });
    }
    const result = await accountService.upgradeSubscription(accountId, prismaTier as 'STAR' | 'THICK');
    res.json({ success: true, newTier: targetTier, account: result });
  } catch (e) {
    next(e);
  }
});

export default router;
