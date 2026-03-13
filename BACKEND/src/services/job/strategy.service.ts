import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

export type StrategyStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type StrategyHorizon = 'QUARTER' | 'YEAR' | 'MULTI_YEAR' | 'CUSTOM';

export class StrategyService {
  async listPlans(accountId: string) {
    const plans = await prisma.jobStrategyPlan.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
    return plans.map((p) => ({
      ...p,
      focusAreas: Array.isArray(p.focusAreas) ? p.focusAreas : [],
    }));
  }

  async getPlan(accountId: string, id: string) {
    const plan = await prisma.jobStrategyPlan.findFirst({
      where: { id, accountId },
    });
    if (!plan) throw new AppError('Strategy plan not found', 404);
    return {
      ...plan,
      focusAreas: Array.isArray(plan.focusAreas) ? plan.focusAreas : [],
    };
  }

  async createPlan(
    accountId: string,
    input: {
      name: string;
      horizon: StrategyHorizon;
      timeframe?: string;
      summary?: string;
      focusAreas?: string[];
    },
  ) {
    const name = (input.name || '').trim();
    if (name.length < 5 || name.length > 200) {
      throw new AppError('Name must be between 5 and 200 characters', 400);
    }

    const allowedHorizons: StrategyHorizon[] = ['QUARTER', 'YEAR', 'MULTI_YEAR', 'CUSTOM'];
    const horizon = allowedHorizons.includes(input.horizon) ? input.horizon : 'YEAR';

    const focusAreas = (input.focusAreas || [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 20);

    const created = await prisma.jobStrategyPlan.create({
      data: {
        accountId,
        name,
        horizon,
        timeframe: input.timeframe?.slice(0, 120) || null,
        summary: input.summary?.slice(0, 2000) || null,
        focusAreas,
        status: 'DRAFT',
      },
    });

    return {
      ...created,
      focusAreas,
    };
  }

  async updatePlan(
    accountId: string,
    id: string,
    input: Partial<{
      name: string;
      horizon: StrategyHorizon;
      timeframe: string | null;
      summary: string | null;
      focusAreas: string[];
      status: StrategyStatus;
    }>,
  ) {
    const existing = await prisma.jobStrategyPlan.findFirst({
      where: { id, accountId },
    });
    if (!existing) throw new AppError('Strategy plan not found', 404);

    const data: any = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length < 5 || name.length > 200) {
        throw new AppError('Name must be between 5 and 200 characters', 400);
      }
      data.name = name;
    }

    if (input.horizon !== undefined) {
      const allowedHorizons: StrategyHorizon[] = ['QUARTER', 'YEAR', 'MULTI_YEAR', 'CUSTOM'];
      if (!allowedHorizons.includes(input.horizon)) {
        throw new AppError('Invalid horizon', 400);
      }
      data.horizon = input.horizon;
    }

    if (input.timeframe !== undefined) {
      data.timeframe = input.timeframe ? input.timeframe.slice(0, 120) : null;
    }

    if (input.summary !== undefined) {
      data.summary = input.summary ? input.summary.slice(0, 2000) : null;
    }

    if (input.focusAreas !== undefined) {
      data.focusAreas = (input.focusAreas || [])
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 20);
    }

    if (input.status !== undefined) {
      const allowedStatuses: StrategyStatus[] = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
      if (!allowedStatuses.includes(input.status)) {
        throw new AppError('Invalid status', 400);
      }
      data.status = input.status;
    }

    const updated = await prisma.jobStrategyPlan.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      focusAreas: Array.isArray(updated.focusAreas) ? updated.focusAreas : [],
    };
  }

  async deletePlan(accountId: string, id: string) {
    const existing = await prisma.jobStrategyPlan.findFirst({
      where: { id, accountId },
      select: { id: true },
    });
    if (!existing) throw new AppError('Strategy plan not found', 404);
    await prisma.jobStrategyPlan.delete({ where: { id } });
    return { ok: true };
  }
}

