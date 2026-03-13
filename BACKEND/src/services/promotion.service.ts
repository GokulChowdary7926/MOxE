import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const OBJECTIVES = ['REACH', 'ENGAGEMENT', 'TRAFFIC', 'CONVERSIONS'] as const;
const STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'] as const;

export class PromotionService {
  async list(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true },
    });
    if (!account || account.accountType !== 'BUSINESS')
      throw new AppError('Business account required', 403);
    return prisma.promotion.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(accountId: string, data: {
    name: string;
    objective: string;
    postId?: string;
    reelId?: string;
    budgetCents: number;
    budgetType?: string;
    startAt?: string;
    endAt?: string;
    targeting?: object;
  }) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true },
    });
    if (!account || account.accountType !== 'BUSINESS')
      throw new AppError('Business account required', 403);
    if (!OBJECTIVES.includes(data.objective as any)) throw new AppError('Invalid objective', 400);
    if (data.budgetCents < 100) throw new AppError('Minimum budget is 1.00', 400);
    return prisma.promotion.create({
      data: {
        accountId,
        name: data.name,
        objective: data.objective,
        postId: data.postId || null,
        reelId: data.reelId || null,
        budgetCents: data.budgetCents,
        budgetType: data.budgetType === 'TOTAL' ? 'TOTAL' : 'DAILY',
        status: 'DRAFT',
        startAt: data.startAt ? new Date(data.startAt) : null,
        endAt: data.endAt ? new Date(data.endAt) : null,
        targeting: data.targeting ?? undefined,
      },
    });
  }

  async update(accountId: string, promotionId: string, data: Partial<{
    name: string;
    status: string;
    budgetCents: number;
    budgetType: string;
    startAt: string;
    endAt: string;
    targeting: object;
  }>) {
    const promo = await prisma.promotion.findFirst({
      where: { id: promotionId, accountId },
    });
    if (!promo) throw new AppError('Promotion not found', 404);
    if (data.status && !STATUSES.includes(data.status as any)) throw new AppError('Invalid status', 400);
    return prisma.promotion.update({
      where: { id: promotionId },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.status != null && { status: data.status }),
        ...(data.budgetCents != null && { budgetCents: data.budgetCents }),
        ...(data.budgetType != null && { budgetType: data.budgetType }),
        ...(data.startAt != null && { startAt: new Date(data.startAt) }),
        ...(data.endAt != null && { endAt: new Date(data.endAt) }),
        ...(data.targeting != null && { targeting: data.targeting }),
      },
    });
  }

  async getOne(accountId: string, promotionId: string) {
    const promo = await prisma.promotion.findFirst({
      where: { id: promotionId, accountId },
    });
    if (!promo) throw new AppError('Promotion not found', 404);
    return promo;
  }

  async delete(accountId: string, promotionId: string) {
    const promo = await prisma.promotion.findFirst({
      where: { id: promotionId, accountId },
    });
    if (!promo) throw new AppError('Promotion not found', 404);
    await prisma.promotion.delete({ where: { id: promotionId } });
    return { ok: true };
  }

  /** Record mock ad event (IMPRESSION or CLICK). Public/optional auth for viewerId. */
  async recordEvent(promotionId: string, eventType: 'IMPRESSION' | 'CLICK', viewerId?: string) {
    const promo = await prisma.promotion.findUnique({ where: { id: promotionId } });
    if (!promo) throw new AppError('Promotion not found', 404);
    if (promo.status !== 'ACTIVE') return;
    await prisma.promotionEvent.create({
      data: { promotionId, eventType, viewerId: viewerId || null },
    });
  }

  /** Get ad performance: impressions, clicks, CTR, spend (mock). */
  async getPerformance(accountId: string, promotionId: string) {
    const promo = await prisma.promotion.findFirst({
      where: { id: promotionId, accountId },
      include: { events: true },
    });
    if (!promo) throw new AppError('Promotion not found', 404);
    const impressions = promo.events.filter((e) => e.eventType === 'IMPRESSION').length;
    const clicks = promo.events.filter((e) => e.eventType === 'CLICK').length;
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
    return {
      promotionId: promo.id,
      name: promo.name,
      status: promo.status,
      impressions,
      clicks,
      ctr: `${ctr}%`,
      budgetCents: promo.budgetCents,
      spendCents: 0,
    };
  }
}
