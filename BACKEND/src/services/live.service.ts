import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class LiveService {
  async create(accountId: string, data: { title: string; description?: string; privacy?: string; scheduledFor?: string }) {
    const privacy = (data.privacy as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME') || 'PUBLIC';
    const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
    return prisma.live.create({
      data: {
        accountId,
        title: (data.title || 'Live').slice(0, 200),
        description: data.description?.slice(0, 500) ?? null,
        status: 'SCHEDULED',
        privacy,
        scheduledFor,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async list() {
    const items = await prisma.live.findMany({
      where: { status: { in: ['SCHEDULED', 'LIVE'] }, privacy: 'PUBLIC' },
      orderBy: { startedAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    return { items, nextCursor: null as string | null };
  }

  /** List ended lives that have a recording available for replay. */
  async listReplays() {
    const items = await prisma.live.findMany({
      where: {
        status: 'ENDED',
        recording: { not: null },
        privacy: 'PUBLIC',
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
    return { items };
  }

  async get(id: string) {
    const live = await prisma.live.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        liveProducts: { include: { product: { select: { id: true, name: true, price: true, compareAtPrice: true, images: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!live) throw new AppError('Live not found', 404);
    return live;
  }

  /** 4.8 Live replay: ended live with recording URL and product tray for replay view. */
  async getReplay(liveId: string) {
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
    if (!live) throw new AppError('Live not found', 404);
    if (live.status !== 'ENDED') throw new AppError('Replay is available only for ended lives', 400);
    return {
      id: live.id,
      title: live.title,
      description: live.description,
      recording: live.recording,
      startedAt: live.startedAt,
      endedAt: live.endedAt,
      privacy: live.privacy,
      account: live.account,
      liveProducts: live.liveProducts,
    };
  }

  /** Ensure live belongs to accountId and return the live row */
  private async assertOwnLive(accountId: string, liveId: string) {
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live) throw new AppError('Live not found', 404);
    if (live.accountId !== accountId) throw new AppError('Forbidden', 403);
    return live;
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
  async purchaseBadge(buyerId: string, liveId: string, tier: string, amount: number) {
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      include: { account: { select: { id: true, badgesEnabled: true } } },
    });
    if (!live) throw new AppError('Live not found', 404);
    if (live.status !== 'LIVE') throw new AppError('Badges can only be purchased during an active live', 400);
    if (!live.account.badgesEnabled) throw new AppError('Creator has not enabled live badges', 400);
    const allowed = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    if (!allowed.includes(String(tier).toUpperCase())) throw new AppError('Invalid badge tier', 400);
    const purchaseId = `stub_badge_${Date.now()}_${buyerId.slice(0, 8)}`;
    const badge = await prisma.liveBadge.create({
      data: { liveId, buyerId, tier: tier.toUpperCase(), amount: Number(amount) || 0, purchaseId },
      include: { buyer: { select: { id: true, username: true, displayName: true } } },
    });
    return { badge };
  }

  /** Guide 9.3.1: Send a gift during live (Hearts, Stars, Crowns, Trophies, Diamonds). */
  async sendGift(giverId: string, liveId: string, giftType: string, amount: number, message?: string) {
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      include: { account: { select: { id: true, giftsEnabled: true } } },
    });
    if (!live) throw new AppError('Live not found', 404);
    if (live.status !== 'LIVE') throw new AppError('Gifts can only be sent during an active live', 400);
    if (!live.account.giftsEnabled) throw new AppError('Creator has not enabled gifts', 400);
    const allowed = ['HEART', 'STAR', 'CROWN', 'TROPHY', 'DIAMOND'];
    if (!allowed.includes(String(giftType).toUpperCase())) throw new AppError('Invalid gift type', 400);
    const purchaseId = `stub_gift_${Date.now()}_${giverId.slice(0, 8)}`;
    const gift = await prisma.liveGift.create({
      data: {
        liveId,
        giverId,
        giftType: giftType.toUpperCase(),
        amount: Number(amount) || 0,
        message: message?.slice(0, 200) ?? null,
        purchaseId,
      },
      include: { giver: { select: { id: true, username: true, displayName: true } } },
    });
    return { gift };
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
}
