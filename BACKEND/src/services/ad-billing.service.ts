import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class AdBillingService {
  private async getOrCreateBillingAccount(accountId: string) {
    let billing = await prisma.adBillingAccount.findUnique({
      where: { accountId },
    });
    if (!billing) {
      billing = await prisma.adBillingAccount.create({
        data: {
          accountId,
        },
      });
    }
    return billing;
  }

  async getSummary(accountId: string) {
    const billing = await this.getOrCreateBillingAccount(accountId);

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const spendAgg = await prisma.adCreditTransaction.aggregate({
      where: {
        billingAccountId: billing.id,
        type: 'AD_SPEND',
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    const monthlySpend = spendAgg._sum.amount ?? 0;

    const invoices = await prisma.adInvoice.findMany({
      where: { billingAccountId: billing.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      accountId,
      currency: billing.currency,
      creditBalance: billing.creditBalance,
      monthlySpend,
      monthlySpendLimit: billing.monthlySpendLimit,
      hardLimit: billing.hardLimit,
      invoices,
    };
  }

  async topUpCredits(accountId: string, amount: number, opts?: { paymentMethod?: string; externalPaymentId?: string }) {
    if (!amount || amount <= 0) throw new AppError('Amount must be positive', 400);
    const billing = await this.getOrCreateBillingAccount(accountId);

    const now = new Date();
    const periodStart = new Date(now);
    const periodEnd = new Date(now);

    const invoice = await prisma.adInvoice.create({
      data: {
        billingAccountId: billing.id,
        periodStart,
        periodEnd,
        amount,
        currency: billing.currency,
        status: 'PAID',
        paymentId: opts?.externalPaymentId ?? null,
        paidAt: now,
      },
    });

    // Optionally mirror into generic Payment table for reporting
    if (opts?.paymentMethod || opts?.externalPaymentId) {
      await prisma.payment.create({
        data: {
          accountId,
          amount,
          type: 'AD_CREDIT',
          referenceId: invoice.id,
          status: 'COMPLETED',
          stripePaymentId: opts.externalPaymentId ?? null,
        },
      });
    }

    const updated = await prisma.adBillingAccount.update({
      where: { id: billing.id },
      data: {
        creditBalance: { increment: amount },
        transactions: {
          create: {
            invoiceId: invoice.id,
            type: 'TOP_UP',
            amount,
            description: 'Ad credits top-up',
          },
        },
      },
    });

    return {
      billingAccount: updated,
      invoice,
    };
  }

  /**
   * Record ad spend against the billing account. This is best-effort and does not
   * block analytics / delivery if it fails.
   */
  async recordSpend(accountId: string, amount: number) {
    if (!amount || amount <= 0) return;
    try {
      const billing = await this.getOrCreateBillingAccount(accountId);
      await prisma.adBillingAccount.update({
        where: { id: billing.id },
        data: {
          creditBalance: { decrement: amount },
          transactions: {
            create: {
              type: 'AD_SPEND',
              amount,
              description: 'Ad impression spend',
            },
          },
        },
      });
    } catch {
      // swallow – billing is best-effort
    }
  }

  /**
   * Check whether the billing account is allowed to serve an additional impression
   * costing `unitCost`, taking into account credit balance and monthly spend limit.
   */
  async canServeImpression(accountId: string, unitCost: number): Promise<boolean> {
    if (unitCost <= 0) return true;
    const billing = await this.getOrCreateBillingAccount(accountId);

    // Soft accounts: always allowed, but we still track spend elsewhere.
    if (!billing.hardLimit && billing.monthlySpendLimit == null) {
      return true;
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const spendAgg = await prisma.adCreditTransaction.aggregate({
      where: {
        billingAccountId: billing.id,
        type: 'AD_SPEND',
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    });
    const monthlySpend = spendAgg._sum.amount ?? 0;

    if (billing.monthlySpendLimit != null && monthlySpend + unitCost > billing.monthlySpendLimit && billing.hardLimit) {
      return false;
    }

    if (billing.hardLimit && billing.creditBalance < unitCost) {
      return false;
    }

    return true;
  }
}

