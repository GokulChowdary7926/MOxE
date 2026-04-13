import Stripe from 'stripe';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { getStripe } from '../utils/stripeClient';
import { getCommerceCnameTarget, verifyCustomDomainCname } from './commerce-domain-verify';

function isStripePaymentIntentId(paymentId: string | null | undefined): boolean {
  return typeof paymentId === 'string' && paymentId.startsWith('pi_');
}

/** Full refund for a successful PaymentIntent; idempotent per order. */
async function refundStripePaymentIntentForOrder(orderId: string, paymentIntentId: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new AppError('Stripe is not configured (STRIPE_SECRET_KEY)', 503);
  try {
    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `moxe_order_refund_${orderId}` },
    );
    return refund.id;
  } catch (err) {
    const e = err as Stripe.StripeRawError;
    const alreadyRefunded =
      e?.code === 'charge_already_refunded' ||
      (typeof e?.message === 'string' && e.message.toLowerCase().includes('already been fully refunded'));
    if (alreadyRefunded) {
      const list = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 5 });
      const id = list.data[0]?.id;
      if (id) return id;
    }
    const msg = (e && 'message' in e && typeof e.message === 'string' && e.message) || 'Stripe refund failed';
    throw new AppError(msg, 502);
  }
}

export class CommerceService {
  /** Public catalog for marketplace browsing (all active business products). */
  async listPublicCatalog(params?: {
    q?: string;
    limit?: number;
    cursor?: string;
    category?: 'all' | 'mobiles' | 'fashion' | 'home' | 'gifts';
    sort?: 'relevance' | 'price-asc' | 'price-desc';
    dealsOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const q = (params?.q || '').trim();
    const limit = Math.min(Math.max(params?.limit ?? 24, 1), 60);

    const category = params?.category || 'all';
    const dealsOnly = !!params?.dealsOnly;
    const minPrice = typeof params?.minPrice === 'number' && !Number.isNaN(params.minPrice) ? Math.max(0, params.minPrice) : null;
    const maxPrice = typeof params?.maxPrice === 'number' && !Number.isNaN(params.maxPrice) ? Math.max(0, params.maxPrice) : null;
    const categoryFilter =
      category === 'mobiles'
        ? [{ name: { contains: 'mobile', mode: 'insensitive' as const } }, { name: { contains: 'phone', mode: 'insensitive' as const } }, { description: { contains: 'smart', mode: 'insensitive' as const } }]
        : category === 'fashion'
          ? [{ name: { contains: 'shirt', mode: 'insensitive' as const } }, { name: { contains: 'dress', mode: 'insensitive' as const } }, { description: { contains: 'fashion', mode: 'insensitive' as const } }]
          : category === 'home'
            ? [{ name: { contains: 'home', mode: 'insensitive' as const } }, { description: { contains: 'kitchen', mode: 'insensitive' as const } }, { description: { contains: 'furniture', mode: 'insensitive' as const } }]
            : category === 'gifts'
              ? [{ name: { contains: 'gift', mode: 'insensitive' as const } }, { description: { contains: 'gift', mode: 'insensitive' as const } }, { description: { contains: 'combo', mode: 'insensitive' as const } }]
              : [];

    const searchFilter = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { account: { username: { contains: q, mode: 'insensitive' as const } } },
            { account: { displayName: { contains: q, mode: 'insensitive' as const } } },
          ],
        }
      : null;

    const where: any = {
      isActive: true,
      account: { accountType: 'BUSINESS', isActive: true },
      ...(dealsOnly ? { compareAtPrice: { gt: 0 } } : {}),
      ...(minPrice != null || maxPrice != null
        ? {
            price: {
              ...(minPrice != null ? { gte: minPrice } : {}),
              ...(maxPrice != null ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(categoryFilter.length || searchFilter
        ? {
            AND: [
              ...(categoryFilter.length ? [{ OR: categoryFilter }] : []),
              ...(searchFilter ? [searchFilter] : []),
            ],
          }
        : {}),
    };

    const orderBy =
      params?.sort === 'price-asc'
        ? ({ price: 'asc' } as const)
        : params?.sort === 'price-desc'
          ? ({ price: 'desc' } as const)
          : ({ createdAt: 'desc' } as const);

    const rows = await prisma.product.findMany({
      where,
      take: limit + 1,
      ...(params?.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      orderBy,
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, -1) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
    return { items, nextCursor };
  }

  async getPublicCatalogProduct(productId: string) {
    const item = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
        account: { accountType: 'BUSINESS', isActive: true },
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        variants: true,
      },
    });
    if (!item) throw new AppError('Product not found', 404);
    return item;
  }

  async ensureBusinessAccount(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true },
    });
    if (!account || (account.accountType !== 'BUSINESS' && account.accountType !== 'CREATOR'))
      throw new AppError('Business or Creator account required', 403);
    return accountId;
  }

  /** Public shop by username (for /shop/:username). Returns seller info + products + collections + banner + featured (Guide 3.5.2). */
  async getShopByUsername(username: string) {
    const account = await prisma.account.findFirst({
      where: { username, accountType: 'BUSINESS', isActive: true },
      select: { id: true, username: true, displayName: true, profilePhoto: true, shopBannerUrl: true, featuredProductIds: true },
    });
    if (!account) return null;
    const [products, ratingAgg, collections] = await Promise.all([
      prisma.product.findMany({
        where: { accountId: account.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.aggregate({
        where: { sellerId: account.id },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.productCollection.findMany({
        where: { accountId: account.id },
        orderBy: { order: 'asc' },
        include: { items: { orderBy: { order: 'asc' }, include: { product: true } } },
      }),
    ]);
    const rating = ratingAgg._count.id > 0 ? Math.round((ratingAgg._avg.rating ?? 0) * 10) / 10 : null;
    const featuredIds = Array.isArray(account.featuredProductIds) ? (account.featuredProductIds as string[]) : [];
    const featuredProducts = featuredIds.length ? products.filter((p) => featuredIds.includes(p.id)) : [];
    return {
      account: { id: account.id, username: account.username, displayName: account.displayName, profilePhoto: account.profilePhoto, shopBannerUrl: account.shopBannerUrl },
      products,
      featuredProducts: featuredProducts.length ? featuredProducts : products.slice(0, 6),
      collections,
      rating,
      reviewsCount: ratingAgg._count.id,
    };
  }

  async listProducts(accountId: string) {
    await this.ensureBusinessAccount(accountId);
    return prisma.product.findMany({
      where: { accountId },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProduct(accountId: string, productId: string) {
    await this.ensureBusinessAccount(accountId);
    const product = await prisma.product.findFirst({
      where: { id: productId, accountId },
      include: { variants: true },
    });
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async createProduct(accountId: string, data: {
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    images?: string[];
    inventory?: number;
    sku?: string;
    isDigital?: boolean;
    variants?: { name: string; value: string; price?: number; inventory?: number }[];
  }) {
    await this.ensureBusinessAccount(accountId);
    const product = await prisma.product.create({
      data: {
        accountId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        images: data.images ?? [],
        inventory: data.inventory ?? null,
        sku: data.sku || null,
        isDigital: data.isDigital ?? false,
      },
    });
    if (data.variants?.length) {
      for (const v of data.variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            value: v.value,
            price: v.price ?? null,
            inventory: v.inventory ?? null,
          },
        });
      }
    }
    return this.getProduct(accountId, product.id);
  }

  async updateProduct(accountId: string, productId: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    compareAtPrice: number;
    images: string[];
    inventory: number;
    sku: string;
    isActive: boolean;
    isDigital: boolean;
  }>) {
    await this.getProduct(accountId, productId);
    return prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.description != null && { description: data.description }),
        ...(data.price != null && { price: data.price }),
        ...(data.compareAtPrice != null && { compareAtPrice: data.compareAtPrice }),
        ...(data.images != null && { images: data.images }),
        ...(data.inventory != null && { inventory: data.inventory }),
        ...(data.sku != null && { sku: data.sku }),
        ...(data.isActive != null && { isActive: data.isActive }),
        ...(data.isDigital != null && { isDigital: data.isDigital }),
      },
    });
  }

  async deleteProduct(accountId: string, productId: string) {
    await this.getProduct(accountId, productId);
    await prisma.productTag.deleteMany({ where: { productId } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.orderItem.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    return { ok: true };
  }

  async listOrdersAsSeller(accountId: string) {
    await this.ensureBusinessAccount(accountId);
    return prisma.order.findMany({
      where: { sellerId: accountId },
      include: {
        buyer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** List orders placed by this account as buyer (for My Orders page). */
  async listOrdersAsBuyer(accountId: string) {
    const orders = await prisma.order.findMany({
      where: { buyerId: accountId },
      include: {
        seller: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        reviews: { where: { reviewerId: accountId }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => {
      const { reviews, ...rest } = o;
      return { ...rest, hasReview: (reviews?.length ?? 0) > 0 };
    });
  }

  /** Get single order by id; caller must be buyer or seller. Includes `viewerRole` for UI (returns / refund actions). */
  async getOrder(accountId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [{ buyerId: accountId }, { sellerId: accountId }],
      },
      include: {
        buyer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        seller: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    const viewerRole = order.buyerId === accountId ? ('buyer' as const) : ('seller' as const);
    return { ...order, viewerRole };
  }

  async updateOrderStatus(accountId: string, orderId: string, status: string, trackingNumber?: string) {
    await this.ensureBusinessAccount(accountId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId: accountId },
    });
    if (!order) throw new AppError('Order not found', 404);
    const valid = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!valid.includes(status)) throw new AppError('Invalid status', 400);
    return prisma.order.update({
      where: { id: orderId },
      data: { status, ...(trackingNumber != null && { trackingNumber }) },
    });
  }

  /** Validate coupon for seller and subtotal; returns discount amount and code to store. */
  async validateCoupon(
    sellerId: string,
    code: string,
    subtotal: number,
  ): Promise<{ discountAmount: number; couponCode: string }> {
    const coupon = await prisma.sellerCoupon.findUnique({
      where: { sellerId_code: { sellerId, code: code.trim().toUpperCase() } },
    });
    if (!coupon) throw new AppError('Invalid or expired coupon', 400);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('Coupon has expired', 400);
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);
    if (coupon.minOrder != null && subtotal < coupon.minOrder) throw new AppError(`Minimum order for this coupon is ${coupon.minOrder}`, 400);
    let discountAmount = 0;
    if (coupon.type === 'PERCENT') {
      discountAmount = Math.round((subtotal * Math.min(100, coupon.value) / 100) * 100) / 100;
    } else if (coupon.type === 'FIXED') {
      discountAmount = Math.min(coupon.value, subtotal);
    }
    return { discountAmount, couponCode: coupon.code };
  }

  /** Create order (e.g. from checkout). Guest checkout: omit buyerId, pass guestEmail (and optional guestName). Optional couponCode applied for this seller. */
  async createOrder(
    buyerId: string | null,
    data: {
      sellerId: string;
      items: { productId: string; variantId?: string; quantity: number; priceAtPurchase: number }[];
      total: number;
      paymentMethod?: string;
      paymentId?: string;
      shippingAddress?: object;
      liveId?: string;
      guestEmail?: string;
      guestName?: string;
      couponCode?: string;
    },
  ) {
    const { sellerId, items, total, paymentMethod, paymentId, shippingAddress, liveId, guestEmail, guestName, couponCode } = data;
    if (!items.length) throw new AppError('At least one item required', 400);
    if (!buyerId && !guestEmail) throw new AppError('Login or provide guest email', 400);
    let finalTotal = total;
    let discountAmount: number | null = null;
    let appliedCouponCode: string | null = null;
    if (couponCode && couponCode.trim()) {
      const applied = await this.validateCoupon(sellerId, couponCode, total);
      discountAmount = applied.discountAmount;
      appliedCouponCode = applied.couponCode;
      finalTotal = Math.max(0, Math.round((total - applied.discountAmount) * 100) / 100);
    }
    const order = await prisma.order.create({
      data: {
        buyerId: buyerId ?? null,
        sellerId,
        total: finalTotal,
        couponCode: appliedCouponCode ?? undefined,
        discountAmount: discountAmount ?? undefined,
        status: 'PENDING',
        paymentMethod: paymentMethod ?? null,
        paymentId: paymentId ?? null,
        shippingAddress: shippingAddress ? (shippingAddress as object) : undefined,
        liveId: liveId ?? null,
        guestEmail: guestEmail ?? null,
        guestName: guestName ?? null,
      },
    });
    if (appliedCouponCode) {
      await prisma.sellerCoupon.updateMany({
        where: { sellerId, code: appliedCouponCode },
        data: { usedCount: { increment: 1 } },
      });
    }
    for (const it of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: it.productId,
          variantId: it.variantId ?? null,
          quantity: it.quantity,
          priceAtPurchase: it.priceAtPurchase,
        },
      });
    }
    const withItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        buyer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
      },
    });
    return withItems ?? order;
  }

  /** List coupons for seller (business/creator). */
  async listCoupons(accountId: string) {
    await this.ensureBusinessAccount(accountId);
    return prisma.sellerCoupon.findMany({
      where: { sellerId: accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Create coupon (code stored uppercase, case-insensitive at apply). */
  async createCoupon(
    accountId: string,
    data: {
      code: string;
      type: 'PERCENT' | 'FIXED';
      value: number;
      minOrder?: number;
      expiresAt?: Date;
      usageLimit?: number;
    },
  ) {
    await this.ensureBusinessAccount(accountId);
    const code = data.code.trim().toUpperCase();
    if (!code) throw new AppError('Coupon code is required', 400);
    if (data.type !== 'PERCENT' && data.type !== 'FIXED') throw new AppError('type must be PERCENT or FIXED', 400);
    if (data.type === 'PERCENT' && (data.value <= 0 || data.value > 100)) throw new AppError('PERCENT value must be 1–100', 400);
    if (data.type === 'FIXED' && data.value <= 0) throw new AppError('FIXED value must be positive', 400);
    return prisma.sellerCoupon.create({
      data: {
        sellerId: accountId,
        code,
        type: data.type,
        value: data.value,
        minOrder: data.minOrder ?? null,
        expiresAt: data.expiresAt ?? null,
        usageLimit: data.usageLimit ?? null,
      },
    });
  }

  /** Update coupon (code cannot be changed to avoid breaking past orders). */
  async updateCoupon(
    accountId: string,
    couponId: string,
    data: Partial<{
      type: 'PERCENT' | 'FIXED';
      value: number;
      minOrder: number | null;
      expiresAt: Date | null;
      usageLimit: number | null;
    }>,
  ) {
    await this.ensureBusinessAccount(accountId);
    const coupon = await prisma.sellerCoupon.findFirst({
      where: { id: couponId, sellerId: accountId },
    });
    if (!coupon) throw new AppError('Coupon not found', 404);
    if (data.type !== undefined && data.type !== 'PERCENT' && data.type !== 'FIXED') throw new AppError('type must be PERCENT or FIXED', 400);
    if (data.type === 'PERCENT' && data.value != null && (data.value <= 0 || data.value > 100)) throw new AppError('PERCENT value must be 1–100', 400);
    if (data.type === 'FIXED' && data.value != null && data.value <= 0) throw new AppError('FIXED value must be positive', 400);
    return prisma.sellerCoupon.update({
      where: { id: couponId },
      data: {
        ...(data.type != null && { type: data.type }),
        ...(data.value != null && { value: data.value }),
        ...(data.minOrder !== undefined && { minOrder: data.minOrder }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
        ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
      },
    });
  }

  /** Delete coupon. */
  async deleteCoupon(accountId: string, couponId: string) {
    await this.ensureBusinessAccount(accountId);
    const coupon = await prisma.sellerCoupon.findFirst({
      where: { id: couponId, sellerId: accountId },
    });
    if (!coupon) throw new AppError('Coupon not found', 404);
    await prisma.sellerCoupon.delete({ where: { id: couponId } });
    return { deleted: true };
  }

  /** Buyer requests return (seller pays return shipping per guide). */
  async requestReturn(buyerId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: buyerId },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'DELIVERED') throw new AppError('Only delivered orders can be returned', 400);
    if (order.returnStatus) throw new AppError('Return already requested', 400);
    return prisma.order.update({
      where: { id: orderId },
      data: { returnStatus: 'PENDING', returnRequestedAt: new Date() },
    });
  }

  /** Seller approves return and can attach prepaid return label URL (seller pays). */
  async approveReturn(sellerId: string, orderId: string, returnLabelUrl?: string) {
    await this.ensureBusinessAccount(sellerId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.returnStatus !== 'PENDING') throw new AppError('No pending return', 400);
    return prisma.order.update({
      where: { id: orderId },
      data: { returnStatus: 'APPROVED', returnLabelUrl: returnLabelUrl ?? order.returnLabelUrl },
    });
  }

  /** Seller sets return tracking number when buyer has shipped back. */
  async setReturnTracking(sellerId: string, orderId: string, returnTrackingNumber: string) {
    await this.ensureBusinessAccount(sellerId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.returnStatus !== 'APPROVED') throw new AppError('Return must be approved first', 400);
    return prisma.order.update({
      where: { id: orderId },
      data: { returnStatus: 'SHIPPED', returnTrackingNumber },
    });
  }

  /** Seller marks return as received (inspect then call refundOrder). */
  async markReturnReceived(sellerId: string, orderId: string) {
    await this.ensureBusinessAccount(sellerId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.returnStatus !== 'SHIPPED' && order.returnStatus !== 'APPROVED') throw new AppError('Invalid state', 400);
    return prisma.order.update({
      where: { id: orderId },
      data: { returnStatus: 'RECEIVED', returnReceivedAt: new Date() },
    });
  }

  /** Seller processes refund after receiving return. Stripe PaymentIntents (`pi_…`) are refunded via Stripe when configured; other payments stay ledger-only. */
  async refundOrder(sellerId: string, orderId: string) {
    await this.ensureBusinessAccount(sellerId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.returnStatus === 'REFUNDED' && order.refundedAt) {
      if (order.status !== 'REFUNDED') {
        return prisma.order.update({
          where: { id: orderId },
          data: { status: 'REFUNDED' },
        });
      }
      return order;
    }
    if (order.returnStatus !== 'RECEIVED') throw new AppError('Mark return as received first', 400);
    let stripeRefundId = order.stripeRefundId ?? null;
    const pid = order.paymentId?.trim() || null;
    if (isStripePaymentIntentId(pid)) {
      if (!stripeRefundId) {
        stripeRefundId = await refundStripePaymentIntentForOrder(orderId, pid!);
      }
    }
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        returnStatus: 'REFUNDED',
        refundedAt: new Date(),
        ...(stripeRefundId && { stripeRefundId }),
      },
    });
  }

  /** Seller dashboard: sales overview (today, week, month) and top products by units/revenue. */
  async getSellerDashboard(sellerId: string) {
    await this.ensureBusinessAccount(sellerId);
    const paidStatuses = ['PAID', 'SHIPPED', 'DELIVERED'];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month, ordersForTop] = await Promise.all([
      prisma.order.aggregate({
        where: { sellerId, status: { in: paidStatuses }, createdAt: { gte: startOfToday } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { sellerId, status: { in: paidStatuses }, createdAt: { gte: startOfWeek } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { sellerId, status: { in: paidStatuses }, createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { sellerId, status: { in: paidStatuses } },
        select: { id: true, items: { select: { productId: true, quantity: true, priceAtPurchase: true } } },
      }),
    ]);

    const productMap = new Map<string, { units: number; revenue: number }>();
    for (const order of ordersForTop) {
      for (const item of order.items) {
        const cur = productMap.get(item.productId) ?? { units: 0, revenue: 0 };
        cur.units += item.quantity;
        cur.revenue += item.quantity * item.priceAtPurchase;
        productMap.set(item.productId, cur);
      }
    }
    const productIds = [...productMap.keys()];
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));
    const topProducts = productIds
      .map((id) => {
        const p = byId.get(id);
        const agg = productMap.get(id)!;
        return { productId: id, name: p?.name ?? 'Unknown', units: agg.units, revenue: agg.revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Fulfillment rate: orders shipped within 3 days of creation (or paid) / total shipped
    const shippedOrders = await prisma.order.findMany({
      where: { sellerId, status: { in: ['SHIPPED', 'DELIVERED'] } },
      select: { id: true, createdAt: true, updatedAt: true },
    });
    const SLA_DAYS = 3;
    const fulfilledOnTime = shippedOrders.filter((o) => {
      const shippedAt = o.updatedAt.getTime();
      const created = o.createdAt.getTime();
      return (shippedAt - created) / (24 * 60 * 60 * 1000) <= SLA_DAYS;
    }).length;
    const fulfillmentRate = shippedOrders.length > 0 ? Math.round((fulfilledOnTime / shippedOrders.length) * 100) : null;

    // 2.35 Response rate: average first response time (minutes) in DMs where seller is participant
    let responseRate: number | null = null;
    const dmMessages = await prisma.message.findMany({
      where: {
        groupId: null,
        OR: [
          { senderId: sellerId },
          { recipients: { some: { recipientId: sellerId } } },
        ],
      },
      select: { id: true, senderId: true, createdAt: true, recipients: { select: { recipientId: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const peerSet = new Set<string>();
    dmMessages.forEach((m) => {
      if (m.senderId === sellerId) m.recipients.forEach((r) => r.recipientId !== sellerId && peerSet.add(r.recipientId));
      else peerSet.add(m.senderId);
    });
    const responseTimesMinutes: number[] = [];
    for (const peerId of peerSet) {
      const thread = dmMessages.filter(
        (m) =>
          (m.senderId === sellerId && m.recipients.some((r) => r.recipientId === peerId)) ||
          (m.senderId === peerId && m.recipients.some((r) => r.recipientId === sellerId))
      );
      let firstFromPeer: Date | null = null;
      for (const msg of thread) {
        if (msg.senderId === peerId) {
          if (!firstFromPeer) firstFromPeer = msg.createdAt;
        } else if (msg.senderId === sellerId && firstFromPeer) {
          responseTimesMinutes.push(Math.round((msg.createdAt.getTime() - firstFromPeer.getTime()) / 60000));
          break;
        }
      }
    }
    if (responseTimesMinutes.length > 0) {
      responseRate = Math.round(responseTimesMinutes.reduce((a, b) => a + b, 0) / responseTimesMinutes.length);
    }

    // 2.36 Benchmark vs category: no category aggregates yet; show "—" in UI when null
    const benchmarkVsCategory: number | null = null;

    return {
      salesOverview: {
        today: Number(today._sum.total ?? 0),
        week: Number(week._sum.total ?? 0),
        month: Number(month._sum.total ?? 0),
      },
      topProducts,
      fulfillmentRate,
      responseRate,
      benchmarkVsCategory,
    };
  }

  /** Shop settings: banner, featured product IDs, custom domain (2.20). */
  async updateShopSettings(sellerId: string, data: {
    shopBannerUrl?: string | null;
    featuredProductIds?: string[];
    customDomain?: string | null;
  }) {
    await this.ensureBusinessAccount(sellerId);
    const account = await prisma.account.findFirst({ where: { id: sellerId }, select: { id: true } });
    if (!account) throw new AppError('Account not found', 404);
    const update: Record<string, unknown> = {};
    if (data.shopBannerUrl !== undefined) update.shopBannerUrl = data.shopBannerUrl;
    if (data.featuredProductIds !== undefined) update.featuredProductIds = data.featuredProductIds;
    if (data.customDomain !== undefined) {
      const domain = data.customDomain === null || data.customDomain === '' ? null : String(data.customDomain).trim().toLowerCase();
      if (domain && !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(domain)) throw new AppError('Invalid domain format', 400);
      update.customDomain = domain;
      update.customDomainVerifiedAt = null; // reset verification when domain changes
    }
    return prisma.account.update({ where: { id: sellerId }, data: update as any });
  }

  /** 2.20 Verify custom domain: CNAME must point to COMMERCE_CUSTOM_DOMAIN_CNAME_TARGET (NBK-024). */
  async verifyCustomDomain(sellerId: string) {
    await this.ensureBusinessAccount(sellerId);
    const account = await prisma.account.findFirst({
      where: { id: sellerId },
      select: { customDomain: true },
    });
    if (!account?.customDomain) throw new AppError('No custom domain set', 400);
    const domain = account.customDomain;

    const isProd = process.env.NODE_ENV === 'production';
    const devDnsBypass = !isProd && (process.env.COMMERCE_DOMAIN_VERIFY_MOCK || '').toLowerCase().trim() === 'true';
    if (devDnsBypass) {
      await prisma.account.update({
        where: { id: sellerId },
        data: { customDomainVerifiedAt: new Date() },
      });
      return {
        verified: true,
        domain,
        devDnsBypass: true,
        message: 'Verified via COMMERCE_DOMAIN_VERIFY_MOCK (non-production only).',
      };
    }

    const expectedTarget = getCommerceCnameTarget();
    if (!expectedTarget) {
      return {
        verified: false,
        domain,
        message: isProd
          ? 'Custom domain verification is not configured (COMMERCE_CUSTOM_DOMAIN_CNAME_TARGET).'
          : 'Set COMMERCE_CUSTOM_DOMAIN_CNAME_TARGET for DNS checks, or COMMERCE_DOMAIN_VERIFY_MOCK=true in development.',
      };
    }

    const { ok, aliases } = await verifyCustomDomainCname(domain, expectedTarget);
    if (!ok) {
      return {
        verified: false,
        domain,
        expectedTarget,
        cnameAliases: aliases,
        message:
          aliases.length === 0
            ? `No CNAME record found for ${domain}. Point a CNAME to ${expectedTarget}.`
            : `CNAME for ${domain} does not point to ${expectedTarget}.`,
      };
    }

    await prisma.account.update({
      where: { id: sellerId },
      data: { customDomainVerifiedAt: new Date() },
    });
    return {
      verified: true,
      domain,
      expectedTarget,
      cnameAliases: aliases,
      message: 'Domain verified.',
    };
  }

  /** Collections CRUD (seller). */
  async listCollections(accountId: string) {
    await this.ensureBusinessAccount(accountId);
    return prisma.productCollection.findMany({
      where: { accountId },
      orderBy: { order: 'asc' },
      include: { items: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, images: true, price: true } } } } },
    });
  }

  async createCollection(accountId: string, name: string) {
    await this.ensureBusinessAccount(accountId);
    return prisma.productCollection.create({
      data: { accountId, name },
      include: { items: true },
    });
  }

  async updateCollection(accountId: string, collectionId: string, data: { name?: string; productIds?: string[] }) {
    await this.ensureBusinessAccount(accountId);
    const col = await prisma.productCollection.findFirst({ where: { id: collectionId, accountId } });
    if (!col) throw new AppError('Collection not found', 404);
    if (data.name != null) await prisma.productCollection.update({ where: { id: collectionId }, data: { name: data.name } });
    if (data.productIds != null) {
      await prisma.productCollectionItem.deleteMany({ where: { collectionId } });
      const products = await prisma.product.findMany({ where: { id: { in: data.productIds }, accountId }, select: { id: true } });
      for (let i = 0; i < products.length; i++) {
        await prisma.productCollectionItem.create({
          data: { collectionId, productId: products[i].id, order: i },
        });
      }
    }
    const updated = await prisma.productCollection.findUnique({
      where: { id: collectionId },
      include: { items: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, images: true, price: true } } } } },
    });
    return updated ?? col;
  }

  async deleteCollection(accountId: string, collectionId: string) {
    await this.ensureBusinessAccount(accountId);
    const col = await prisma.productCollection.findFirst({ where: { id: collectionId, accountId } });
    if (!col) throw new AppError('Collection not found', 404);
    await prisma.productCollection.delete({ where: { id: collectionId } });
    return { ok: true };
  }

  /** Wishlist (buyer). */
  async addToWishlist(accountId: string, productId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) throw new AppError('Product not found', 404);
    await prisma.productWishlist.upsert({
      where: { accountId_productId: { accountId, productId } },
      create: { accountId, productId },
      update: {},
    });
    return { ok: true };
  }

  async removeFromWishlist(accountId: string, productId: string) {
    await prisma.productWishlist.deleteMany({ where: { accountId, productId } });
    return { ok: true };
  }

  async getWishlist(accountId: string) {
    const items = await prisma.productWishlist.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { account: { select: { id: true, username: true } } } } },
    });
    return items;
  }

  /** Multi-seller cart (2.42). */
  async getOrCreateCart(accountId: string) {
    let cart = await prisma.cart.findUnique({
      where: { accountId },
      include: {
        items: {
          include: {
            product: {
              include: { account: { select: { id: true, username: true, displayName: true } } },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { accountId },
        include: {
          items: {
            include: {
              product: {
                include: { account: { select: { id: true, username: true, displayName: true } } },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  async getCart(accountId: string) {
    const cart = await prisma.cart.findUnique({
      where: { accountId },
      include: {
        items: {
          include: {
            product: {
              include: { account: { select: { id: true, username: true, displayName: true } } },
            },
          },
        },
      },
    });
    return cart ?? { id: '', accountId, createdAt: new Date(), updatedAt: new Date(), items: [] };
  }

  async addToCart(accountId: string, productId: string, quantity = 1) {
    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) throw new AppError('Product not found', 404);
    let cart = await prisma.cart.findUnique({ where: { accountId } });
    if (!cart) cart = await prisma.cart.create({ data: { accountId } });
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const q = Math.max(1, Math.min(quantity, product.inventory ?? 99));
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + q, priceAtAdd: product.price },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: q, priceAtAdd: product.price },
      });
    }
    return this.getOrCreateCart(accountId);
  }

  async updateCartItem(accountId: string, cartItemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { accountId } });
    if (!cart) throw new AppError('Cart not found', 404);
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
      include: { product: true },
    });
    if (!item) throw new AppError('Cart item not found', 404);
    const q = Math.max(0, Math.min(quantity, item.product.inventory ?? 99));
    if (q === 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity: q } });
    }
    return this.getOrCreateCart(accountId);
  }

  async removeFromCart(accountId: string, productId: string) {
    const cart = await prisma.cart.findUnique({ where: { accountId } });
    if (!cart) return this.getOrCreateCart(accountId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return this.getOrCreateCart(accountId);
  }

  /** Checkout from cart: create one order per seller, then clear cart. */
  async checkoutFromCart(
    accountId: string,
    data: {
      shippingAddress?: object;
      paymentMethod?: string;
      paymentId?: string;
      guestEmail?: string;
      guestName?: string;
      couponCode?: string;
      sellerCoupons?: Record<string, string>;
    }
  ) {
    const cart = await prisma.cart.findUnique({
      where: { accountId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);
    const bySeller = new Map<string, { productId: string; variantId?: string; quantity: number; priceAtPurchase: number }[]>();
    for (const it of cart.items) {
      const sellerId = it.product.accountId;
      const list = bySeller.get(sellerId) ?? [];
      list.push({
        productId: it.productId,
        quantity: it.quantity,
        priceAtPurchase: it.priceAtAdd,
      });
      bySeller.set(sellerId, list);
    }
    const orders: any[] = [];
    for (const [sellerId, items] of bySeller) {
      const total = items.reduce((s, i) => s + i.quantity * i.priceAtPurchase, 0);
      const perSellerCode =
        (data.sellerCoupons && data.sellerCoupons[sellerId]) || data.couponCode;
      const order = await this.createOrder(accountId, {
        sellerId,
        items,
        total,
        paymentMethod: data.paymentMethod,
        paymentId: data.paymentId,
        shippingAddress: data.shippingAddress,
        guestEmail: data.guestEmail,
        guestName: data.guestName,
        couponCode: perSellerCode,
      });
      orders.push(order);
    }
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { orders };
  }
}
