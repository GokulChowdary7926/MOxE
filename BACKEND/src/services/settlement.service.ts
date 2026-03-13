/**
 * Seller settlements (Guide 3.8): 7-day cycle, commission, payout records.
 * Default commission 10%; optional weekly cron to create Payout records.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const DEFAULT_COMMISSION_PCT = 10;
const FIXED_FEE_PER_ORDER = 5;

export async function listPayouts(sellerId: string, limit = 50) {
  const payouts = await prisma.payout.findMany({
    where: { sellerId },
    orderBy: { periodEnd: 'desc' },
    take: limit,
  });
  return payouts;
}

export async function getPayout(sellerId: string, payoutId: string) {
  const payout = await prisma.payout.findFirst({
    where: { id: payoutId, sellerId },
  });
  if (!payout) throw new AppError('Payout not found', 404);
  return payout;
}

/** Create payout record for a period (called by cron or admin). */
export async function createPayoutForPeriod(
  sellerId: string,
  periodStart: Date,
  periodEnd: Date,
  commissionPct = DEFAULT_COMMISSION_PCT
) {
  const paidStatuses = ['PAID', 'SHIPPED', 'DELIVERED'];
  const orders = await prisma.order.findMany({
    where: {
      sellerId,
      status: { in: paidStatuses },
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    select: { id: true, total: true },
  });
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const commissionAmt = (totalSales * commissionPct) / 100;
  const feesAmt = orders.length * FIXED_FEE_PER_ORDER;
  const refunds = await prisma.order.findMany({
    where: { sellerId, refundedAt: { gte: periodStart, lt: periodEnd } },
    select: { total: true },
  });
  const returnDeductions = refunds.reduce((sum, o) => sum + o.total, 0);
  const netAmount = totalSales - commissionAmt - feesAmt - returnDeductions;
  const existing = await prisma.payout.findFirst({
    where: { sellerId, periodStart, periodEnd },
  });
  if (existing) return existing;
  return prisma.payout.create({
    data: {
      sellerId,
      periodStart,
      periodEnd,
      totalSales,
      commissionPct,
      commissionAmt,
      feesAmt,
      returnDeductions,
      netAmount,
      status: 'PENDING',
    },
  });
}
