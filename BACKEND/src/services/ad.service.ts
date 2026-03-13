import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type AdStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type AdType = 'BOOST' | 'STANDARD';

export interface CreateCampaignInput {
  name: string;
  objective?: string;
  type?: AdType;
  dailyBudget?: number | null;
  totalBudget?: number | null;
  bidCpm?: number | null;
  currency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  postId?: string | null;
}

export interface UpdateCampaignInput {
  name?: string;
  objective?: string;
  status?: AdStatus;
  dailyBudget?: number | null;
  totalBudget?: number | null;
  bidCpm?: number | null;
  currency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export class AdService {
  private async ensureCanAdvertise(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, accountType: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    if (account.accountType !== 'BUSINESS' && account.accountType !== 'CREATOR') {
      throw new AppError('Business or Creator account required for ads', 403);
    }
    return account;
  }

  async createCampaign(accountId: string, input: CreateCampaignInput) {
    await this.ensureCanAdvertise(accountId);
    if (!input.name || !input.name.trim()) throw new AppError('Name is required', 400);
    if (input.dailyBudget != null && input.dailyBudget <= 0) {
      throw new AppError('dailyBudget must be positive', 400);
    }
    if (input.totalBudget != null && input.totalBudget <= 0) {
      throw new AppError('totalBudget must be positive', 400);
    }
    if (input.bidCpm != null && input.bidCpm <= 0) {
      throw new AppError('bidCpm must be positive when provided', 400);
    }
    const now = new Date();
    const startDate = input.startDate ?? now;
    const status: AdStatus = startDate > now ? 'DRAFT' : 'ACTIVE';
    const campaign = await prisma.adCampaign.create({
      data: {
        accountId,
        name: input.name.trim(),
        objective: input.objective?.trim() || 'AWARENESS',
        type: input.type ?? 'STANDARD',
        status,
        dailyBudget: input.dailyBudget ?? null,
        totalBudget: input.totalBudget ?? null,
        bidCpm: input.bidCpm ?? null,
        currency: input.currency?.toUpperCase() || 'USD',
        startDate,
        endDate: input.endDate ?? null,
        postId: input.postId ?? null,
      },
    });
    return this.getCampaign(accountId, campaign.id);
  }

  async listAudiences(accountId: string) {
    await this.ensureCanAdvertise(accountId);
    const rows = await prisma.adAudience.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
    return rows;
  }

  async createAudience(accountId: string, input: { name: string; description?: string; definition?: Record<string, unknown> }) {
    await this.ensureCanAdvertise(accountId);
    if (!input.name || !input.name.trim()) throw new AppError('Name is required', 400);
    const audience = await prisma.adAudience.create({
      data: {
        accountId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        definition: input.definition ? (input.definition as object) : undefined,
      },
    });
    return audience;
  }

  async attachAudienceToCampaign(accountId: string, campaignId: string, audienceId: string) {
    await this.ensureCanAdvertise(accountId);
    const campaign = await prisma.adCampaign.findFirst({
      where: { id: campaignId, accountId },
      select: { id: true },
    });
    if (!campaign) throw new AppError('Ad campaign not found', 404);
    const audience = await prisma.adAudience.findFirst({
      where: { id: audienceId, accountId },
      select: { id: true },
    });
    if (!audience) throw new AppError('Audience not found', 404);
    await prisma.adCampaignAudience.upsert({
      where: { campaignId_audienceId: { campaignId, audienceId } },
      create: { campaignId, audienceId },
      update: {},
    });
    return this.getCampaign(accountId, campaignId);
  }

  async listCampaigns(accountId: string, status?: AdStatus) {
    await this.ensureCanAdvertise(accountId);
    const where: any = { accountId };
    if (status) where.status = status;
    const campaigns = await prisma.adCampaign.findMany({
      where,
      include: {
        audiences: {
          include: {
            audience: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!campaigns.length) return [];
    const ids = campaigns.map((c) => c.id);
    const insightRows = await prisma.adCampaignInsight.groupBy({
      by: ['campaignId'],
      where: { campaignId: { in: ids } },
      _sum: { impressions: true, clicks: true, spend: true },
    });
    const byCampaign = new Map(
      insightRows.map((r) => [
        r.campaignId,
        {
          impressions: r._sum.impressions ?? 0,
          clicks: r._sum.clicks ?? 0,
          spend: r._sum.spend ?? 0,
        },
      ]),
    );
    return campaigns.map((c) => {
      const agg = byCampaign.get(c.id) ?? { impressions: 0, clicks: 0, spend: 0 };
      const ctr = agg.impressions > 0 ? Math.round((agg.clicks / agg.impressions) * 1000) / 10 : 0;
      return {
        ...c,
        attachedAudiences: (c.audiences ?? []).map((link) => ({
          id: link.audience.id,
          name: link.audience.name,
        })),
        metrics: {
          impressions: agg.impressions,
          clicks: agg.clicks,
          spend: agg.spend,
          ctr,
        },
      };
    });
  }

  async getCampaign(accountId: string, id: string) {
    await this.ensureCanAdvertise(accountId);
    const campaign = await prisma.adCampaign.findFirst({
      where: { id, accountId },
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            createdAt: true,
          },
        },
      },
    });
    if (!campaign) throw new AppError('Ad campaign not found', 404);
    const agg = await prisma.adCampaignInsight.aggregate({
      where: { campaignId: id },
      _sum: { impressions: true, clicks: true, spend: true },
    });
    const impressions = agg._sum.impressions ?? 0;
    const clicks = agg._sum.clicks ?? 0;
    const spend = agg._sum.spend ?? 0;
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;
    return {
      ...campaign,
      metrics: {
        impressions,
        clicks,
        spend,
        ctr,
      },
    };
  }

  async updateCampaign(accountId: string, id: string, input: UpdateCampaignInput) {
    await this.ensureCanAdvertise(accountId);
    const existing = await prisma.adCampaign.findFirst({
      where: { id, accountId },
    });
    if (!existing) throw new AppError('Ad campaign not found', 404);
    if (input.dailyBudget != null && input.dailyBudget <= 0) {
      throw new AppError('dailyBudget must be positive', 400);
    }
    if (input.totalBudget != null && input.totalBudget <= 0) {
      throw new AppError('totalBudget must be positive', 400);
    }
    if (input.bidCpm != null && input.bidCpm <= 0) {
      throw new AppError('bidCpm must be positive when provided', 400);
    }
    const allowedStatuses: AdStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
    if (input.status && !allowedStatuses.includes(input.status)) {
      throw new AppError('Invalid status', 400);
    }
    const updated = await prisma.adCampaign.update({
      where: { id },
      data: {
        ...(input.name != null && { name: input.name.trim() }),
        ...(input.objective != null && { objective: input.objective.trim() }),
        ...(input.status != null && { status: input.status }),
        ...(input.dailyBudget !== undefined && { dailyBudget: input.dailyBudget }),
        ...(input.totalBudget !== undefined && { totalBudget: input.totalBudget }),
        ...(input.bidCpm !== undefined && { bidCpm: input.bidCpm }),
        ...(input.currency != null && { currency: input.currency.toUpperCase() }),
        ...(input.startDate !== undefined && { startDate: input.startDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
    });
    return this.getCampaign(accountId, updated.id);
  }

  /**
   * Create a simple BOOST campaign around an existing post.
   * Used by "Boost post" / "Promote" UI for Business & Creator accounts.
   */
  async createBoostCampaign(accountId: string, input: { postId: string; dailyBudget?: number | null; totalBudget?: number | null; durationDays?: number; currency?: string }) {
    await this.ensureCanAdvertise(accountId);
    if (!input.postId) throw new AppError('postId is required', 400);
    const post = await prisma.post.findFirst({
      where: { id: input.postId, accountId },
      select: { id: true, caption: true, createdAt: true },
    });
    if (!post) throw new AppError('Post not found or not owned by this account', 404);
    const durationDays = input.durationDays && input.durationDays > 0 ? input.durationDays : 7;
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + durationDays);
    const caption = post.caption ?? '';
    const shortCaption = caption.slice(0, 40) + (caption.length > 40 ? '…' : '');
    const name = `Boost: ${shortCaption || post.id}`;
    const campaign = await prisma.adCampaign.create({
      data: {
        accountId,
        postId: post.id,
        name,
        objective: 'AWARENESS',
        type: 'BOOST',
        status: 'ACTIVE',
        dailyBudget: input.dailyBudget ?? null,
        totalBudget: input.totalBudget ?? null,
        currency: input.currency?.toUpperCase() || 'USD',
        startDate: now,
        endDate,
      },
    });
    return this.getCampaign(accountId, campaign.id);
  }
}

