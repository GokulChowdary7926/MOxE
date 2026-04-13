import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { CommerceService } from '../services/commerce.service';
import { ReviewService } from '../services/review.service';
import * as settlementService from '../services/settlement.service';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const router = Router();
const commerceService = new CommerceService();
const reviewService = new ReviewService();

router.get('/', (_req, res) => res.json({ service: 'commerce' }));

/** Public shop by username (no auth). */
router.get('/shop/:username', async (req, res, next) => {
  try {
    const shop = await commerceService.getShopByUsername(req.params.username);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (e) {
    next(e);
  }
});

/** MOxE Website: public shop data for username.moxe.store (same as shop, for website generation). */
router.get('/website/:username', async (req, res, next) => {
  try {
    const shop = await commerceService.getShopByUsername(req.params.username);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (e) {
    next(e);
  }
});

/** Webinar library: educational videos for sellers (no auth required to list). */
router.get('/webinars', async (_req, res, next) => {
  try {
    const webinars = await prisma.sellerWebinar.findMany({
      orderBy: [{ topic: 'asc' }, { order: 'asc' }],
    });
    res.json(webinars);
  } catch (e) {
    next(e);
  }
});

/** Public catalog (buyer marketplace feed). */
router.get('/catalog', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = Number(req.query.limit) || 24;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
    const dealsOnly = req.query.dealsOnly === 'true';
    const minPriceRaw = typeof req.query.minPrice === 'string' ? Number(req.query.minPrice) : undefined;
    const maxPriceRaw = typeof req.query.maxPrice === 'string' ? Number(req.query.maxPrice) : undefined;
    const minPrice = typeof minPriceRaw === 'number' && Number.isFinite(minPriceRaw) ? minPriceRaw : undefined;
    const maxPrice = typeof maxPriceRaw === 'number' && Number.isFinite(maxPriceRaw) ? maxPriceRaw : undefined;
    const result = await commerceService.listPublicCatalog({
      q,
      cursor,
      limit,
      category: (category as any) || 'all',
      sort: (sort as any) || 'relevance',
      dealsOnly,
      minPrice,
      maxPrice,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/catalog/:productId', async (req, res, next) => {
  try {
    const item = await commerceService.getPublicCatalogProduct(req.params.productId);
    res.json(item);
  } catch (e) {
    next(e);
  }
});

/** Public: aggregate rating + count for seller. */
router.get('/reviews/aggregate', async (req, res, next) => {
  try {
    const sellerId = req.query.sellerId as string;
    if (!sellerId) return res.status(400).json({ error: 'sellerId required' });
    const result = await reviewService.getRatingForSeller(sellerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Public: list reviews for a seller. */
router.get('/reviews', async (req, res, next) => {
  try {
    const sellerId = req.query.sellerId as string;
    if (!sellerId) return res.status(400).json({ error: 'sellerId required' });
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await reviewService.listBySeller(sellerId, cursor, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.use(authenticate);

/** Commerce: Business account only. */
async function ensureBusinessCommerce(req: any) {
  const accountId = req.user?.accountId;
  if (!accountId) throw new AppError('Unauthorized', 401);
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { accountType: true },
  });
  if (!account || account.accountType !== 'BUSINESS')
    throw new AppError('Business account required for commerce', 403);
  return accountId;
}

/** Accept seller responsibility terms (Guide 3.10). Business/Creator only. */
router.post('/seller-terms/accept', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true },
    });
    if (!account || (account.accountType !== 'BUSINESS' && account.accountType !== 'CREATOR'))
      return res.status(403).json({ error: 'Business or Creator account required' });
    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { sellerTermsAcceptedAt: new Date() },
      select: { sellerTermsAcceptedAt: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const dashboard = await commerceService.getSellerDashboard(accountId);
    res.json(dashboard);
  } catch (e) {
    next(e);
  }
});

/** Shop settings: banner, featured product IDs, custom domain (2.20). */
router.patch('/shop-settings', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { shopBannerUrl, featuredProductIds, customDomain } = req.body ?? {};
    const updated = await commerceService.updateShopSettings(accountId, { shopBannerUrl, featuredProductIds, customDomain });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/** 2.20 Verify custom domain (CNAME to COMMERCE_CUSTOM_DOMAIN_CNAME_TARGET; dev mock: COMMERCE_DOMAIN_VERIFY_MOCK). */
router.post('/custom-domain/verify', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const result = await commerceService.verifyCustomDomain(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Collections (seller). */
router.get('/collections', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const list = await commerceService.listCollections(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});
router.post('/collections', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { name } = req.body ?? {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const col = await commerceService.createCollection(accountId, String(name));
    res.status(201).json(col);
  } catch (e) {
    next(e);
  }
});
router.patch('/collections/:collectionId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { name, productIds } = req.body ?? {};
    const col = await commerceService.updateCollection(accountId, req.params.collectionId, { name, productIds });
    res.json(col);
  } catch (e) {
    next(e);
  }
});
router.delete('/collections/:collectionId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    await commerceService.deleteCollection(accountId, req.params.collectionId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Wishlist (buyer – any authenticated user). */
router.get('/wishlist', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await commerceService.getWishlist(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});
router.post('/wishlist/:productId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await commerceService.addToWishlist(accountId, req.params.productId);
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});
router.delete('/wishlist/:productId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await commerceService.removeFromWishlist(accountId, req.params.productId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------- Cart (2.42 multi-seller) ----------
router.get('/cart', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cart = await commerceService.getOrCreateCart(accountId);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});
router.post('/cart/items', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { productId, quantity } = req.body ?? {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const cart = await commerceService.addToCart(accountId, productId, quantity ? Number(quantity) : 1);
    res.status(201).json(cart);
  } catch (e) {
    next(e);
  }
});
router.patch('/cart/items/:cartItemId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const quantity = Number((req as any).body?.quantity);
    if (Number.isNaN(quantity)) return res.status(400).json({ error: 'quantity required' });
    const cart = await commerceService.updateCartItem(accountId, req.params.cartItemId, quantity);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});
router.delete('/cart/items/:productId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const cart = await commerceService.removeFromCart(accountId, req.params.productId);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});
router.post('/cart/checkout', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { shippingAddress, paymentMethod, paymentId, guestEmail, guestName, couponCode } = req.body ?? {};
    const result = await commerceService.checkoutFromCart(accountId, {
      shippingAddress,
      paymentMethod,
      paymentId,
      guestEmail,
      guestName,
      couponCode,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Seller coupons (create/list/update/delete). Business/Creator only. */
router.get('/coupons', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const list = await commerceService.listCoupons(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});
router.post('/coupons', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { code, type, value, minOrder, expiresAt, usageLimit } = req.body ?? {};
    const coupon = await commerceService.createCoupon(accountId, {
      code,
      type,
      value,
      minOrder,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      usageLimit,
    });
    res.status(201).json(coupon);
  } catch (e) {
    next(e);
  }
});
router.patch('/coupons/:couponId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { type, value, minOrder, expiresAt, usageLimit } = req.body ?? {};
    const coupon = await commerceService.updateCoupon(accountId, req.params.couponId, {
      type,
      value,
      minOrder,
      expiresAt: expiresAt !== undefined ? (expiresAt === null ? null : new Date(expiresAt)) : undefined,
      usageLimit,
    });
    res.json(coupon);
  } catch (e) {
    next(e);
  }
});
router.delete('/coupons/:couponId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const result = await commerceService.deleteCoupon(accountId, req.params.couponId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const products = await commerceService.listProducts(accountId);
    res.json(products);
  } catch (e) {
    next(e);
  }
});

router.get('/products/:productId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const product = await commerceService.getProduct(accountId, req.params.productId);
    res.json(product);
  } catch (e) {
    next(e);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const product = await commerceService.createProduct(accountId, req.body);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
});

router.patch('/products/:productId', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const product = await commerceService.updateProduct(accountId, req.params.productId, req.body);
    res.json(product);
  } catch (e) {
    next(e);
  }
});

router.delete('/products/:productId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    await commerceService.deleteProduct(accountId, req.params.productId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const asBuyer = (req as any).query?.asBuyer === 'true';
    const orders = asBuyer
      ? await commerceService.listOrdersAsBuyer(accountId)
      : await commerceService.listOrdersAsSeller(accountId);
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

router.get('/orders/:orderId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const order = await commerceService.getOrder(accountId, req.params.orderId);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.post('/orders', optionalAuthenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId ?? null;
    const { sellerId, items, total, paymentMethod, paymentId, shippingAddress, liveId, guestEmail, guestName } = req.body ?? {};
    if (!accountId && !guestEmail) return res.status(400).json({ error: 'Login or provide guestEmail' });
    const order = await commerceService.createOrder(accountId, {
      sellerId,
      items: items ?? [],
      total: Number(total) ?? 0,
      paymentMethod,
      paymentId,
      shippingAddress,
      liveId,
      guestEmail,
      guestName,
    });
    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

router.patch('/orders/:orderId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { status, trackingNumber } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    const order = await commerceService.updateOrderStatus(accountId, req.params.orderId, status, trackingNumber);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.post('/orders/:orderId/return', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const order = await commerceService.requestReturn(accountId, req.params.orderId);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.post('/orders/:orderId/return/approve', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { returnLabelUrl } = req.body ?? {};
    const order = await commerceService.approveReturn(accountId, req.params.orderId, returnLabelUrl);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.patch('/orders/:orderId/return/tracking', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { returnTrackingNumber } = req.body ?? {};
    const order = await commerceService.setReturnTracking(accountId, req.params.orderId, returnTrackingNumber);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.post('/orders/:orderId/return/received', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const order = await commerceService.markReturnReceived(accountId, req.params.orderId);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.post('/orders/:orderId/return/refund', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const order = await commerceService.refundOrder(accountId, req.params.orderId);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

// ---------- Customer Reviews (Guide 3.2.2) ----------
/** Create review as buyer (order must be DELIVERED, one per order). */
router.post('/orders/:orderId/review', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const review = await reviewService.create(accountId, req.params.orderId, req.body ?? {});
    res.status(201).json(review);
  } catch (e) {
    next(e);
  }
});

/** Seller responds to a review. */
router.patch('/reviews/:reviewId/respond', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const { replyText } = req.body ?? {};
    if (replyText == null) return res.status(400).json({ error: 'replyText required' });
    const review = await reviewService.respond(accountId, req.params.reviewId, String(replyText));
    res.json(review);
  } catch (e) {
    next(e);
  }
});

/** Report a review (e.g. REVIEW_FAKE). */
router.post('/reviews/:reviewId/report', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { reason, description } = req.body ?? {};
    await reviewService.report(accountId, req.params.reviewId, reason ?? 'REVIEW_FAKE', description);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Record product tag click (Guide 3.5.1 - track tag clicks). */
router.post('/product-tag/click', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { productId, postId, storyId, reelId } = req.body ?? {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    await prisma.productTagClick.create({
      data: {
        productId,
        postId: postId || null,
        storyId: storyId || null,
        reelId: reelId || null,
        viewerId: accountId,
      },
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------- Settlements (Guide 3.8) ----------
router.get('/settlements', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const payouts = await settlementService.listPayouts(accountId);
    res.json(payouts);
  } catch (e) {
    next(e);
  }
});

router.get('/settlements/:payoutId', async (req, res, next) => {
  try {
    const accountId = await ensureBusinessCommerce(req);
    const payout = await settlementService.getPayout(accountId, req.params.payoutId);
    res.json(payout);
  } catch (e) {
    next(e);
  }
});

export default router;
