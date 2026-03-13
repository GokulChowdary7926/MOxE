/**
 * Creator subscriptions (Guide Section 9.1): tiers, subscribe, list subscribers.
 * Gated by canSubscriptions (Creator Paid / THICK).
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export interface TierOffer {
  key: string;
  name: string;
  price: number;
  perks?: string[];
}

export class CreatorSubscriptionService {
  async getTiers(creatorId: string): Promise<TierOffer[]> {
    const account = await prisma.account.findUnique({
      where: { id: creatorId },
      select: { subscriptionTierOffers: true, accountType: true, subscriptionsEnabled: true },
    });
    if (!account) throw new AppError('Creator not found', 404);
    const offers = (account.subscriptionTierOffers as TierOffer[] | null) ?? [];
    return Array.isArray(offers) ? offers : [];
  }

  /** Get tiers and welcome message for creator (my tiers page). */
  async getTiersWithWelcome(accountId: string): Promise<{ tiers: TierOffer[]; welcomeMessage: string | null }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTierOffers: true, subscriptionWelcomeMessage: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    const offers = (account.subscriptionTierOffers as TierOffer[] | null) ?? [];
    const tiers = Array.isArray(offers) ? offers : [];
    return { tiers, welcomeMessage: account.subscriptionWelcomeMessage ?? null };
  }

  async setTiers(accountId: string, tiers: TierOffer[], welcomeMessage?: string | null): Promise<TierOffer[]> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true, subscriptionTier: true, subscriptionsEnabled: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    if (account.accountType !== 'CREATOR' && account.accountType !== 'BUSINESS')
      throw new AppError('Only Creator/Business accounts can set subscription tiers', 403);
    if (!account.subscriptionsEnabled)
      throw new AppError('Enable subscriptions (Creator Paid) to set tiers', 403);
    const valid = tiers.slice(0, 5).map((t) => ({
      key: String(t.key || '').slice(0, 32),
      name: String(t.name || '').slice(0, 64),
      price: Number(t.price) >= 0 ? Number(t.price) : 0,
      perks: Array.isArray(t.perks) ? t.perks.slice(0, 10) : undefined,
    }));
    const welcome = welcomeMessage === undefined ? undefined : (welcomeMessage?.trim().slice(0, 1000) ?? null);
    await prisma.account.update({
      where: { id: accountId },
      data: {
        subscriptionTierOffers: valid,
        ...(welcome !== undefined && { subscriptionWelcomeMessage: welcome }),
      },
    });
    return valid;
  }

  /** Get creator's welcome message for new subscribers (Guide 9.1.1). */
  async getWelcomeMessage(creatorId: string): Promise<string | null> {
    const account = await prisma.account.findUnique({
      where: { id: creatorId },
      select: { subscriptionWelcomeMessage: true },
    });
    return account?.subscriptionWelcomeMessage ?? null;
  }

  async subscribe(subscriberId: string, creatorId: string, tierKey: string): Promise<{ subscription: any }> {
    if (subscriberId === creatorId) throw new AppError('Cannot subscribe to yourself', 400);
    const [creator, existing] = await Promise.all([
      prisma.account.findUnique({
        where: { id: creatorId },
        select: { subscriptionTierOffers: true, subscriptionsEnabled: true },
      }),
      prisma.subscription.findFirst({
        where: { subscriberId, creatorId, status: 'ACTIVE' },
      }),
    ]);
    if (!creator) throw new AppError('Creator not found', 404);
    if (!creator.subscriptionsEnabled) throw new AppError('Creator has not enabled subscriptions', 400);
    if (existing) throw new AppError('Already subscribed', 400);
    const offers = (creator.subscriptionTierOffers as TierOffer[] | null) ?? [];
    const tier = Array.isArray(offers) ? offers.find((t) => t.key === tierKey) : null;
    if (!tier) throw new AppError('Invalid tier', 400);
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const subscription = await prisma.subscription.create({
      data: {
        subscriberId,
        creatorId,
        tier: tierKey,
        price: tier.price,
        status: 'ACTIVE',
        startDate: start,
        endDate: end,
      },
    });
    return { subscription };
  }

  async listMySubscriptions(accountId: string): Promise<{ subscriptions: any[] }> {
    const list = await prisma.subscription.findMany({
      where: { subscriberId: accountId, status: 'ACTIVE' },
      include: { creator: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { subscriptions: list };
  }

  async listSubscribers(accountId: string): Promise<{ subscribers: any[] }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true, subscriptionsEnabled: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    if (account.accountType !== 'CREATOR' && account.accountType !== 'BUSINESS')
      throw new AppError('Only creators can list subscribers', 403);
    const list = await prisma.subscription.findMany({
      where: { creatorId: accountId, status: 'ACTIVE' },
      include: { subscriber: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { subscribers: list };
  }

  /** Cancel (unsubscribe) my subscription to a creator (Guide 9.1.3 cancelSubscription). */
  async unsubscribe(subscriberId: string, creatorId: string): Promise<{ ok: boolean }> {
    const sub = await prisma.subscription.findFirst({
      where: { subscriberId, creatorId, status: 'ACTIVE' },
    });
    if (!sub) throw new AppError('No active subscription to this creator', 404);
    const now = new Date();
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelAt: now, endDate: now },
    });
    return { ok: true };
  }

  /** Export subscribers as CSV (Section 9.1.3). */
  async exportSubscribersCsv(accountId: string): Promise<string> {
    const { subscribers } = await this.listSubscribers(accountId);
    const header = 'id,username,displayName,tier,price,startDate,endDate';
    const rows = subscribers.map((s: any) => {
      const sub = s.subscriber;
      return [
        sub?.id ?? '',
        sub?.username ?? '',
        (sub?.displayName ?? '').replace(/,/g, ' '),
        s.tier ?? '',
        s.price ?? '',
        s.startDate ? new Date(s.startDate).toISOString().slice(0, 10) : '',
        s.endDate ? new Date(s.endDate).toISOString().slice(0, 10) : '',
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }
}
