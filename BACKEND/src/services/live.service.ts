import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { normalizeStoredMediaUrl } from '../utils/mediaUrl';

/** Accept CDN / uploaded paths for VOD; reject javascript: etc. */
export function normalizeLiveRecordingUrl(raw: string): string {
  const u = String(raw ?? '').trim();
  if (!u) throw new AppError('Recording URL is required', 400);
  if (u.startsWith('/uploads/')) return u.slice(0, 2000);
  if (/^https:\/\//i.test(u)) return u.slice(0, 2000);
  if (/^http:\/\/localhost(:\d+)?\//i.test(u)) return u.slice(0, 2000);
  throw new AppError('Invalid recording URL (use https:// or /uploads/…)', 400);
}

async function normalizeLiveForApi<T extends { recording?: unknown; liveProducts?: Array<{ product?: { images?: unknown } }> }>(
  live: T,
): Promise<T> {
  const normalizedRecording =
    typeof live.recording === 'string' ? await normalizeStoredMediaUrl(live.recording) : live.recording;
  const normalizedProducts = Array.isArray(live.liveProducts)
    ? await Promise.all(
        live.liveProducts.map(async (lp) => {
          const images = lp.product?.images;
          if (!Array.isArray(images)) return lp;
          const normalized = await Promise.all(
            images.map(async (img) => (typeof img === 'string' ? await normalizeStoredMediaUrl(img) : img)),
          );
          return { ...lp, product: { ...(lp.product ?? {}), images: normalized } };
        }),
      )
    : live.liveProducts;
  return { ...live, recording: normalizedRecording, liveProducts: normalizedProducts };
}
import {
  assertBadgePaymentIntent,
  assertGiftPaymentIntent,
  createBadgePaymentIntent as stripeCreateBadgePaymentIntent,
  createGiftPaymentIntent as stripeCreateGiftPaymentIntent,
  isLiveStripePurchasesEnabled,
  localLedgerPurchaseId,
} from './live-purchase.service';

export class LiveService {
  private async canViewerAccessLive(
    viewerId: string | null,
    ownerId: string,
    privacy: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME',
  ): Promise<boolean> {
    if (viewerId && viewerId === ownerId) return true;
    if (privacy === 'PUBLIC') return true;
    if (!viewerId) return false;
    if (privacy === 'ONLY_ME') return false;
    const [viewerBlockedOwner, ownerBlockedViewer] = await Promise.all([
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewerId, blockedId: ownerId } },
        select: { expiresAt: true },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: ownerId, blockedId: viewerId } },
        select: { expiresAt: true },
      }),
    ]);
    const now = new Date();
    const isActive = (expiresAt: Date | null) => expiresAt == null || expiresAt > now;
    if ((viewerBlockedOwner && isActive(viewerBlockedOwner.expiresAt)) || (ownerBlockedViewer && isActive(ownerBlockedViewer.expiresAt))) {
      return false;
    }
    if (privacy === 'FOLLOWERS_ONLY') {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: ownerId } },
      });
      return !!follow;
    }
    if (privacy === 'CLOSE_FRIENDS_ONLY') {
      const cf = await prisma.closeFriend.findUnique({
        where: { accountId_friendId: { accountId: ownerId, friendId: viewerId } },
      });
      return !!cf;
    }
    return false;
  }

  async create(
    accountId: string,
    data: {
      title: string;
      description?: string;
      privacy?: string;
      scheduledFor?: string;
      fundraiserTitle?: string | null;
      fundraiserUrl?: string | null;
      fundraiserGoalAmount?: number | null;
      fundraiserCurrency?: string | null;
    },
  ) {
    const privacy = (data.privacy as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME') || 'PUBLIC';
    const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
    const fundTitle = data.fundraiserTitle?.trim().slice(0, 200) || null;
    const fundUrl = data.fundraiserUrl?.trim().slice(0, 500) || null;
    const fundGoal =
      data.fundraiserGoalAmount != null && !Number.isNaN(Number(data.fundraiserGoalAmount))
        ? Math.max(0, Number(data.fundraiserGoalAmount))
        : null;
    const fundCur = (data.fundraiserCurrency || 'USD').trim().slice(0, 10) || 'USD';
    const hasFund = !!(fundTitle || fundUrl || fundGoal != null);
    const created = await prisma.live.create({
      data: {
        accountId,
        title: (data.title || 'Live').slice(0, 200),
        description: data.description?.slice(0, 500) ?? null,
        status: 'SCHEDULED',
        privacy,
        scheduledFor,
        fundraiserTitle: fundTitle,
        fundraiserUrl: fundUrl,
        fundraiserGoalAmount: fundGoal,
        fundraiserCurrency: hasFund ? fundCur : null,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    return await normalizeLiveForApi(created);
  }

  async list(viewerId: string | null = null) {
    const baseItems = await prisma.live.findMany({
      where: { deletedAt: null, status: { in: ['SCHEDULED', 'LIVE'] } },
      orderBy: { startedAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    const items = [];
    for (const live of baseItems) {
      const allowed = await this.canViewerAccessLive(viewerId, live.accountId, live.privacy as any);
      if (allowed) items.push(await normalizeLiveForApi(live));
    }
    return { items, nextCursor: null as string | null };
  }

  /** List ended lives that have a recording available for replay. */
  async listReplays(viewerId: string | null = null) {
    const baseItems = await prisma.live.findMany({
      where: {
        deletedAt: null,
        status: 'ENDED',
        recording: { not: null },
      },
      orderBy: { endedAt: 'desc' },
      include: {
        account: {
          select: { id: true, username: true, displayName: true, profilePhoto: true },
        },
        liveProducts: {
          include: {
            product: {
              select: { id: true, name: true, price: true, compareAtPrice: true, images: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const items = [];
    for (const live of baseItems) {
      const allowed = await this.canViewerAccessLive(viewerId, live.accountId, live.privacy as any);
      if (allowed) items.push(await normalizeLiveForApi(live));
    }
    return { items };
  }

  async get(id: string, viewerId: string | null = null) {
    const live = await prisma.live.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, compareAtPrice: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!live || live.deletedAt) throw new AppError('Live not found', 404);
    const allowed = await this.canViewerAccessLive(viewerId, live.accountId, live.privacy as any);
    if (!allowed) throw new AppError('Live not found', 404);
    return await normalizeLiveForApi(live);
  }

  /** 4.8 Live replay: ended live with recording URL and product tray for replay view. */
  async getReplay(liveId: string, viewerId: string | null = null) {
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: {
          include: {
            product: { select: { id: true, name: true, price: true, compareAtPrice: true, images: true } },
          },
          orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });
    if (!live || live.deletedAt) throw new AppError('Live not found', 404);
    if (live.status !== 'ENDED') throw new AppError('Replay is available only for ended lives', 400);
    if (!live.recording || !String(live.recording).trim()) {
      throw new AppError('Replay not available for this live', 404);
    }
    const allowed = await this.canViewerAccessLive(viewerId, live.accountId, live.privacy as any);
    if (!allowed) throw new AppError('Replay not found', 404);
    return await normalizeLiveForApi({
      id: live.id,
      title: live.title,
      description: live.description,
      recording: live.recording,
      startedAt: live.startedAt,
      endedAt: live.endedAt,
      privacy: live.privacy,
      account: live.account,
      liveProducts: live.liveProducts,
    });
  }

  /** Ensure live belongs to accountId and return the live row */
  private async assertOwnLive(accountId: string, liveId: string) {
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live || live.deletedAt) throw new AppError('Live not found', 404);
    if (live.accountId !== accountId) throw new AppError('Forbidden', 403);
    return live;
  }

  /** Start a scheduled live (set status LIVE, startedAt). */
  async startLive(accountId: string, liveId: string) {
    const live = await this.assertOwnLive(accountId, liveId);
    if (live.status !== 'SCHEDULED') throw new AppError('Live can only be started when scheduled', 400);
    const updated = await prisma.live.update({
      where: { id: liveId },
      data: { status: 'LIVE', startedAt: new Date() },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    return await normalizeLiveForApi(updated);
  }

  /** End an active live (set status ENDED, endedAt). Optionally attach a VOD `recording` URL (https or /uploads/…). */
  async endLive(accountId: string, liveId: string, opts?: { recording?: string | null }) {
    const live = await this.assertOwnLive(accountId, liveId);
    if (live.status !== 'LIVE') throw new AppError('Only an active live can be ended', 400);
    const recRaw = opts?.recording;
    const data: { status: string; endedAt: Date; recording?: string } = {
      status: 'ENDED',
      endedAt: new Date(),
    };
    if (recRaw != null && String(recRaw).trim() !== '') {
      data.recording = normalizeLiveRecordingUrl(String(recRaw));
    }
    const updated = await prisma.live.update({
      where: { id: liveId },
      data,
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    return await normalizeLiveForApi(updated);
  }

  /** After a live has ended, set or replace the replay recording URL (host only). */
  async setLiveRecording(accountId: string, liveId: string, recording: string) {
    const live = await this.assertOwnLive(accountId, liveId);
    if (live.status !== 'ENDED') throw new AppError('Recording can only be set after the live has ended', 400);
    const url = normalizeLiveRecordingUrl(recording);
    const updated = await prisma.live.update({
      where: { id: liveId },
      data: { recording: url },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    return await normalizeLiveForApi(updated);
  }

  async updateFundraiser(
    accountId: string,
    liveId: string,
    body: {
      fundraiserTitle?: string | null;
      fundraiserUrl?: string | null;
      fundraiserGoalAmount?: number | null;
      fundraiserCurrency?: string | null;
    },
  ) {
    const live = await this.assertOwnLive(accountId, liveId);
    if (live.status === 'ENDED') throw new AppError('Cannot update a ended live', 400);
    const title =
      body.fundraiserTitle !== undefined
        ? body.fundraiserTitle?.trim().slice(0, 200) || null
        : live.fundraiserTitle;
    const url =
      body.fundraiserUrl !== undefined ? body.fundraiserUrl?.trim().slice(0, 500) || null : live.fundraiserUrl;
    const goal =
      body.fundraiserGoalAmount !== undefined
        ? body.fundraiserGoalAmount != null && !Number.isNaN(Number(body.fundraiserGoalAmount))
          ? Math.max(0, Number(body.fundraiserGoalAmount))
          : null
        : live.fundraiserGoalAmount;
    const curRaw =
      body.fundraiserCurrency !== undefined
        ? (body.fundraiserCurrency || 'USD').trim().slice(0, 10) || 'USD'
        : live.fundraiserCurrency;
    const hasFund = !!(title || url || goal != null);
    const updated = await prisma.live.update({
      where: { id: liveId },
      data: {
        fundraiserTitle: title,
        fundraiserUrl: url,
        fundraiserGoalAmount: goal,
        fundraiserCurrency: hasFund ? curRaw || 'USD' : null,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    return await normalizeLiveForApi(updated);
  }

  /** Add products to a live (Live Shopping). Products must belong to the same account as the live. */
  async addProductsToLive(accountId: string, liveId: string, body: { productIds: string[]; liveDiscountPercent?: number }) {
    await this.assertOwnLive(accountId, liveId);
    const { productIds, liveDiscountPercent } = body;
    if (!productIds?.length) throw new AppError('productIds required', 400);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, accountId },
      select: { id: true },
    });
    const foundIds = new Set(products.map((p) => p.id));
    const invalid = productIds.filter((id) => !foundIds.has(id));
    if (invalid.length) throw new AppError(`Products not found or not yours: ${invalid.join(', ')}`, 400);
    const maxOrder = await prisma.liveProduct.aggregate({ where: { liveId }, _max: { sortOrder: true } });
    let sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    const discount = liveDiscountPercent != null ? Math.min(100, Math.max(0, liveDiscountPercent)) : null;
    await prisma.liveProduct.createMany({
      data: productIds.map((productId) => ({
        liveId,
        productId,
        sortOrder: sortOrder++,
        liveDiscountPercent: discount,
      })),
      skipDuplicates: true,
    });
    return this.get(liveId);
  }

  /** Remove a product from a live */
  async removeProductFromLive(accountId: string, liveId: string, productId: string) {
    await this.assertOwnLive(accountId, liveId);
    await prisma.liveProduct.deleteMany({ where: { liveId, productId } });
    return this.get(liveId);
  }

  /** Pin one product for the live (unpins others). Pass null to unpin all. */
  async setPinnedProduct(accountId: string, liveId: string, productId: string | null) {
    await this.assertOwnLive(accountId, liveId);
    await prisma.liveProduct.updateMany({ where: { liveId }, data: { isPinned: false } });
    if (productId) {
      await prisma.liveProduct.updateMany({ where: { liveId, productId }, data: { isPinned: true } });
    }
    return this.get(liveId);
  }

  /** Set live-only discount percent for a product in this live */
  async setLiveDiscount(accountId: string, liveId: string, productId: string, liveDiscountPercent: number | null) {
    await this.assertOwnLive(accountId, liveId);
    const updated = await prisma.liveProduct.updateMany({
      where: { liveId, productId },
      data: { liveDiscountPercent: liveDiscountPercent != null ? Math.min(100, Math.max(0, liveDiscountPercent)) : null },
    });
    if (updated.count === 0) throw new AppError('Product not in this live', 404);
    return this.get(liveId);
  }

  /** List orders placed during this live (for host analytics) */
  async getLiveSales(liveId: string, accountId: string) {
    await this.assertOwnLive(accountId, liveId);
    const orders = await prisma.order.findMany({
      where: { liveId, sellerId: accountId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true } } } }, buyer: { select: { id: true, username: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    return { orders, total, count: orders.length };
  }

  /** Guide 9.2.1: Purchase a live badge (Bronze/Silver/Gold/Platinum). Creator must have badgesEnabled. */
  async purchaseBadge(
    buyerId: string,
    liveId: string,
    tier: string,
    amount: number,
    opts?: { paymentIntentId?: string }
  ) {
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      include: { account: { select: { id: true, badgesEnabled: true } } },
    });
    if (!live) throw new AppError('Live not found', 404);
    if (live.status !== 'LIVE') throw new AppError('Badges can only be purchased during an active live', 400);
    if (!live.account.badgesEnabled) throw new AppError('Creator has not enabled live badges', 400);
    const allowed = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const tierU = String(tier).toUpperCase();
    if (!allowed.includes(tierU)) throw new AppError('Invalid badge tier', 400);
    const amt = Number(amount) || 0;

    let purchaseId: string;
    if (isLiveStripePurchasesEnabled()) {
      const pi = opts?.paymentIntentId?.trim();
      if (!pi) {
        throw new AppError(
          'paymentIntentId is required when LIVE_STRIPE_ENABLED=true. Create a PaymentIntent first (POST .../badges/payment-intent).',
          400
        );
      }
      purchaseId = await assertBadgePaymentIntent({
        paymentIntentId: pi,
        buyerId,
        liveId,
        tier: tierU,
        amount: amt,
      });
      const existing = await prisma.liveBadge.findFirst({ where: { purchaseId } });
      if (existing) {
        return {
          badge: await prisma.liveBadge.findUniqueOrThrow({
            where: { id: existing.id },
            include: { buyer: { select: { id: true, username: true, displayName: true } } },
          }),
        };
      }
    } else {
      purchaseId = localLedgerPurchaseId('badge');
    }

    const badge = await prisma.liveBadge.create({
      data: { liveId, buyerId, tier: tierU, amount: amt, purchaseId },
      include: { buyer: { select: { id: true, username: true, displayName: true } } },
    });
    return { badge };
  }

  /** Guide 9.3.1: Send a gift during live (Hearts, Stars, Crowns, Trophies, Diamonds). */
  async sendGift(
    giverId: string,
    liveId: string,
    giftType: string,
    amount: number,
    message?: string,
    opts?: { paymentIntentId?: string }
  ) {
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      include: { account: { select: { id: true, giftsEnabled: true } } },
    });
    if (!live) throw new AppError('Live not found', 404);
    if (live.status !== 'LIVE') throw new AppError('Gifts can only be sent during an active live', 400);
    if (!live.account.giftsEnabled) throw new AppError('Creator has not enabled gifts', 400);
    const allowed = ['HEART', 'STAR', 'CROWN', 'TROPHY', 'DIAMOND'];
    const typeU = String(giftType).toUpperCase();
    if (!allowed.includes(typeU)) throw new AppError('Invalid gift type', 400);
    const amt = Number(amount) || 0;

    let purchaseId: string;
    if (isLiveStripePurchasesEnabled()) {
      const pi = opts?.paymentIntentId?.trim();
      if (!pi) {
        throw new AppError(
          'paymentIntentId is required when LIVE_STRIPE_ENABLED=true. Create a PaymentIntent first (POST .../gifts/payment-intent).',
          400
        );
      }
      purchaseId = await assertGiftPaymentIntent({
        paymentIntentId: pi,
        giverId,
        liveId,
        giftType: typeU,
        amount: amt,
      });
      const existing = await prisma.liveGift.findFirst({ where: { purchaseId } });
      if (existing) {
        return {
          gift: await prisma.liveGift.findUniqueOrThrow({
            where: { id: existing.id },
            include: { giver: { select: { id: true, username: true, displayName: true } } },
          }),
        };
      }
    } else {
      purchaseId = localLedgerPurchaseId('gift');
    }

    const gift = await prisma.liveGift.create({
      data: {
        liveId,
        giverId,
        giftType: typeU,
        amount: amt,
        message: message?.slice(0, 200) ?? null,
        purchaseId,
      },
      include: { giver: { select: { id: true, username: true, displayName: true } } },
    });
    return { gift };
  }

  /** Stripe PaymentIntent for a badge (client confirms with Stripe.js). Requires LIVE_STRIPE_ENABLED + STRIPE_SECRET_KEY. */
  async createBadgePaymentIntent(buyerId: string, liveId: string, tier: string, amount: number) {
    if (!isLiveStripePurchasesEnabled()) {
      throw new AppError('Live Stripe purchases are not enabled (set LIVE_STRIPE_ENABLED=true and STRIPE_SECRET_KEY)', 400);
    }
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      include: { account: { select: { id: true, badgesEnabled: true } } },
    });
    if (!live) throw new AppError('Live not found', 404);
    if (live.status !== 'LIVE') throw new AppError('Badges can only be purchased during an active live', 400);
    if (!live.account.badgesEnabled) throw new AppError('Creator has not enabled live badges', 400);
    const allowed = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const tierU = String(tier).toUpperCase();
    if (!allowed.includes(tierU)) throw new AppError('Invalid badge tier', 400);
    return stripeCreateBadgePaymentIntent({
      buyerId,
      liveId,
      tier: tierU,
      amount: Number(amount) || 0,
    });
  }

  /** Stripe PaymentIntent for a gift. Requires LIVE_STRIPE_ENABLED + STRIPE_SECRET_KEY. */
  async createGiftPaymentIntent(giverId: string, liveId: string, giftType: string, amount: number) {
    if (!isLiveStripePurchasesEnabled()) {
      throw new AppError('Live Stripe purchases are not enabled (set LIVE_STRIPE_ENABLED=true and STRIPE_SECRET_KEY)', 400);
    }
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      include: { account: { select: { id: true, giftsEnabled: true } } },
    });
    if (!live) throw new AppError('Live not found', 404);
    if (live.status !== 'LIVE') throw new AppError('Gifts can only be sent during an active live', 400);
    if (!live.account.giftsEnabled) throw new AppError('Creator has not enabled gifts', 400);
    const allowed = ['HEART', 'STAR', 'CROWN', 'TROPHY', 'DIAMOND'];
    const typeU = String(giftType).toUpperCase();
    if (!allowed.includes(typeU)) throw new AppError('Invalid gift type', 400);
    return stripeCreateGiftPaymentIntent({
      giverId,
      liveId,
      giftType: typeU,
      amount: Number(amount) || 0,
    });
  }

  /** Guide 9.2.2: Badge analytics for this live (host only). */
  async getBadgeAnalytics(liveId: string, accountId: string) {
    await this.assertOwnLive(accountId, liveId);
    const badges = await prisma.liveBadge.findMany({
      where: { liveId },
      include: { buyer: { select: { id: true, username: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const byTier = badges.reduce((acc, b) => {
      acc[b.tier] = (acc[b.tier] || 0) + b.amount;
      return acc;
    }, {} as Record<string, number>);
    const total = badges.reduce((sum, b) => sum + b.amount, 0);
    return { total, byTier, badges, count: badges.length };
  }

  /** Guide 9.3.2: Gift analytics for this live (host only). */
  async getGiftAnalytics(liveId: string, accountId: string) {
    await this.assertOwnLive(accountId, liveId);
    const gifts = await prisma.liveGift.findMany({
      where: { liveId },
      include: { giver: { select: { id: true, username: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const byType = gifts.reduce((acc, g) => {
      acc[g.giftType] = (acc[g.giftType] || 0) + g.amount;
      return acc;
    }, {} as Record<string, number>);
    const total = gifts.reduce((sum, g) => sum + g.amount, 0);
    return { total, byType, gifts, count: gifts.length };
  }

  private async assertLiveParticipationViewer(viewerId: string, liveId: string) {
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live || live.deletedAt) throw new AppError('Live not found', 404);
    const allowed = await this.canViewerAccessLive(viewerId, live.accountId, live.privacy as any);
    if (!allowed) throw new AppError('Live not found', 404);
    if (live.status !== 'LIVE') throw new AppError('Questions are only available during a live broadcast', 400);
    return live;
  }

  private async assertHostOrModerator(actorId: string, liveId: string) {
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live || live.deletedAt) throw new AppError('Live not found', 404);
    if (live.accountId === actorId) return live;
    const mod = await prisma.liveModerator.findUnique({
      where: { liveId_moderatorId: { liveId, moderatorId: actorId } },
    });
    if (!mod) throw new AppError('Forbidden', 403);
    return live;
  }

  async listLiveQuestions(liveId: string, viewerId: string | null) {
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live || live.deletedAt) throw new AppError('Live not found', 404);
    const allowed = await this.canViewerAccessLive(viewerId, live.accountId, live.privacy as any);
    if (!allowed) throw new AppError('Live not found', 404);
    const questions = await prisma.liveQuestion.findMany({
      where: { liveId },
      include: { asker: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'asc' }],
    });
    return { questions };
  }

  async askLiveQuestion(askerId: string, liveId: string, text: string) {
    await this.assertLiveParticipationViewer(askerId, liveId);
    const t = (text || '').trim().slice(0, 500);
    if (!t) throw new AppError('Question text required', 400);
    const q = await prisma.liveQuestion.create({
      data: { liveId, askerId, text: t },
      include: { asker: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    return { question: q };
  }

  async pinLiveQuestion(actorId: string, liveId: string, questionId: string, pinned: boolean) {
    await this.assertHostOrModerator(actorId, liveId);
    const q = await prisma.liveQuestion.findFirst({ where: { id: questionId, liveId } });
    if (!q) throw new AppError('Question not found', 404);
    if (pinned) {
      await prisma.liveQuestion.updateMany({ where: { liveId }, data: { pinned: false } });
    }
    const updated = await prisma.liveQuestion.update({
      where: { id: questionId },
      data: { pinned },
      include: { asker: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    return { question: updated };
  }

  async markLiveQuestionAnswered(actorId: string, liveId: string, questionId: string, answered: boolean) {
    await this.assertHostOrModerator(actorId, liveId);
    const q = await prisma.liveQuestion.findFirst({ where: { id: questionId, liveId } });
    if (!q) throw new AppError('Question not found', 404);
    const updated = await prisma.liveQuestion.update({
      where: { id: questionId },
      data: { answered },
      include: { asker: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    return { question: updated };
  }

  async listLiveModerators(liveId: string, viewerId: string | null) {
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live || live.deletedAt) throw new AppError('Live not found', 404);
    const allowed = await this.canViewerAccessLive(viewerId, live.accountId, live.privacy as any);
    if (!allowed) throw new AppError('Live not found', 404);
    const moderators = await prisma.liveModerator.findMany({
      where: { liveId },
      include: { moderator: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return { moderators };
  }

  async addLiveModerator(hostId: string, liveId: string, moderatorUsername: string) {
    const live = await this.assertOwnLive(hostId, liveId);
    if (live.status !== 'LIVE' && live.status !== 'SCHEDULED') {
      throw new AppError('Moderators can only be assigned for scheduled or live broadcasts', 400);
    }
    const uname = (moderatorUsername || '').trim().replace(/^@/, '');
    if (!uname) throw new AppError('moderatorUsername required', 400);
    const modAcc = await prisma.account.findUnique({
      where: { username: uname },
      select: { id: true, username: true, displayName: true, profilePhoto: true },
    });
    if (!modAcc) throw new AppError('Account not found', 404);
    if (modAcc.id === live.accountId) throw new AppError('Host is already a moderator', 400);
    await prisma.liveModerator.upsert({
      where: { liveId_moderatorId: { liveId, moderatorId: modAcc.id } },
      create: { liveId, moderatorId: modAcc.id, assignedById: hostId },
      update: {},
    });
    return this.listLiveModerators(liveId, hostId);
  }

  async removeLiveModerator(hostId: string, liveId: string, moderatorId: string) {
    await this.assertOwnLive(hostId, liveId);
    await prisma.liveModerator.deleteMany({ where: { liveId, moderatorId } });
    return this.listLiveModerators(liveId, hostId);
  }
}
