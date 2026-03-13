/**
 * Customer reviews (Guide 3.2.2): create, list, respond, report.
 * One review per order per buyer; optional text and media; seller can reply.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class ReviewService {
  /** Create review by buyer after order is DELIVERED. One review per order per buyer. */
  async create(reviewerId: string, orderId: string, data: { rating: number; text?: string; media?: string[] }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, sellerId: true, status: true },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId !== reviewerId) throw new AppError('You can only review your own orders', 403);
    if (order.status !== 'DELIVERED') throw new AppError('Order must be delivered before reviewing', 400);
    const existing = await prisma.review.findUnique({
      where: { orderId_reviewerId: { orderId, reviewerId } },
    });
    if (existing) throw new AppError('You have already reviewed this order', 400);
    const rating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 0)));
    if (!rating) throw new AppError('Rating must be 1-5', 400);
    const text = data.text != null ? String(data.text).slice(0, 2000) : null;
    const media = Array.isArray(data.media) ? data.media.slice(0, 5) : [];
    return prisma.review.create({
      data: {
        sellerId: order.sellerId,
        orderId,
        reviewerId,
        rating,
        text: text || null,
        media,
      },
      include: {
        reviewer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
  }

  /** List reviews for a seller (public or seller viewing own). */
  async listBySeller(sellerId: string, cursor?: string, limit = 20) {
    const take = Math.min(limit, 50);
    const reviews = await prisma.review.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        reviewer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    const nextCursor = reviews.length > take ? reviews[take - 1].id : null;
    return { items: reviews.slice(0, take), nextCursor };
  }

  /** Aggregate rating and count for seller (profile/shop). */
  async getRatingForSeller(sellerId: string) {
    const agg = await prisma.review.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      rating: agg._count.id > 0 ? Math.round((agg._avg.rating ?? 0) * 10) / 10 : null,
      reviewsCount: agg._count.id,
    };
  }

  /** Seller responds to a review. */
  async respond(sellerId: string, reviewId: string, replyText: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new AppError('Review not found', 404);
    if (review.sellerId !== sellerId) throw new AppError('Not your review', 403);
    const text = String(replyText).slice(0, 1000);
    return prisma.review.update({
      where: { id: reviewId },
      data: { replyText: text, repliedAt: new Date() },
      include: {
        reviewer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
  }

  /** Report a review (e.g. REVIEW_FAKE). */
  async report(reporterId: string, reviewId: string, reason: string, description?: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new AppError('Review not found', 404);
    await prisma.report.create({
      data: {
        reporterId,
        reportedReviewId: reviewId,
        reason: reason || 'REVIEW_FAKE',
        description: description ? String(description).slice(0, 500) : null,
      },
    });
    return { ok: true };
  }
}
