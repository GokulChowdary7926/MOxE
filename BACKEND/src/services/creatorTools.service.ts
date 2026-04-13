/**
 * Creator tools: quick replies, auto-responses, content calendar, best time,
 * trending audio, content ideas, creator network, brand marketplace, reel bonus.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { isProductionFreeSubscriptionsEnabled } from '../constants/tierCapabilities';

export class CreatorToolsService {
  /** 13.2 Quick replies (message templates) */
  async listMessageTemplates(accountId: string) {
    return prisma.messageTemplate.findMany({
      where: { accountId },
      orderBy: { shortcut: 'asc' },
    });
  }

  async createMessageTemplate(accountId: string, data: { shortcut: string; body: string; category?: string }) {
    const shortcut = String(data.shortcut).replace(/^\//, '').slice(0, 32);
    return prisma.messageTemplate.create({
      data: { accountId, shortcut, body: data.body.slice(0, 2000), category: data.category?.slice(0, 50) ?? null },
    });
  }

  async updateMessageTemplate(accountId: string, id: string, data: { shortcut?: string; body?: string; category?: string }) {
    const existing = await prisma.messageTemplate.findFirst({ where: { id, accountId } });
    if (!existing) throw new AppError('Template not found', 404);
    return prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(data.shortcut != null && { shortcut: String(data.shortcut).replace(/^\//, '').slice(0, 32) }),
        ...(data.body != null && { body: data.body.slice(0, 2000) }),
        ...(data.category !== undefined && { category: data.category?.slice(0, 50) ?? null }),
      },
    });
  }

  async deleteMessageTemplate(accountId: string, id: string) {
    await prisma.messageTemplate.deleteMany({ where: { id, accountId } });
    return { deleted: true };
  }

  /** 13.3 Auto-response rules */
  async listAutoResponseRules(accountId: string) {
    return prisma.autoResponseRule.findMany({
      where: { accountId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createAutoResponseRule(accountId: string, data: { type: string; trigger?: string; message: string; isActive?: boolean; priority?: number }) {
    const type = ['KEYWORD', 'FIRST_MESSAGE', 'AFTER_HOURS', 'VACATION'].includes(data.type) ? data.type : 'KEYWORD';
    return prisma.autoResponseRule.create({
      data: {
        accountId,
        type,
        trigger: data.trigger?.slice(0, 200) ?? null,
        message: data.message.slice(0, 2000),
        isActive: data.isActive ?? true,
        priority: data.priority ?? 0,
      },
    });
  }

  async updateAutoResponseRule(accountId: string, id: string, data: Partial<{ type: string; trigger: string; message: string; isActive: boolean; priority: number }>) {
    const existing = await prisma.autoResponseRule.findFirst({ where: { id, accountId } });
    if (!existing) throw new AppError('Rule not found', 404);
    return prisma.autoResponseRule.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.trigger !== undefined && { trigger: data.trigger?.slice(0, 200) ?? null }),
        ...(data.message != null && { message: data.message.slice(0, 2000) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
    });
  }

  async deleteAutoResponseRule(accountId: string, id: string) {
    await prisma.autoResponseRule.deleteMany({ where: { id, accountId } });
    return { deleted: true };
  }

  /** 11.3 Content calendar: scheduled posts, reels, stories (drafts + scheduled) */
  async getContentCalendar(accountId: string, month: string) {
    let start: Date;
    let end: Date;
    const m = month.match(/^(\d{4})-(\d{2})$/);
    if (!m) {
      const d = new Date();
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    } else {
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      start = new Date(y, mo, 1);
      end = new Date(y, mo + 1, 0, 23, 59, 59);
    }
    const posts = await prisma.post.findMany({
      where: {
        accountId,
        isDeleted: false,
        OR: [
          { isScheduled: true, scheduledFor: { gte: start, lte: end } },
          { isScheduled: false, createdAt: { gte: start, lte: end } },
        ],
      },
      select: { id: true, scheduledFor: true, isScheduled: true, createdAt: true },
    });
    const reels = await prisma.reel.findMany({
      where: {
        accountId,
        OR: [
          { isScheduled: true, scheduledFor: { gte: start, lte: end } },
          { createdAt: { gte: start, lte: end } },
        ],
      },
      select: { id: true, scheduledFor: true, isScheduled: true, createdAt: true },
    });
    const drafts = await prisma.draft.findMany({
      where: { accountId, expiresAt: { gt: new Date() } },
      select: { id: true, type: true, expiresAt: true, createdAt: true },
    });
    return {
      month,
      posts: posts.map((p) => ({ id: p.id, type: 'POST', at: (p.scheduledFor ?? p.createdAt).toISOString(), isScheduled: p.isScheduled })),
      reels: reels.map((r) => ({ id: r.id, type: 'REEL', at: (r.scheduledFor ?? r.createdAt).toISOString(), isScheduled: r.isScheduled })),
      drafts: drafts.map((d) => ({ id: d.id, type: d.type, expiresAt: d.expiresAt.toISOString() })),
    };
  }

  /** 11.4.4 Best time recommendations (from analytics activity) */
  async getBestTimeRecommendations(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true, subscriptionTier: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    if (!isProductionFreeSubscriptionsEnabled() && account.subscriptionTier !== 'STAR' && account.subscriptionTier !== 'THICK')
      throw new AppError('Best time recommendations require Creator Paid or Star', 403);
    const events = await prisma.analyticsEvent.findMany({
      where: { accountId, timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { eventType: true, timestamp: true },
    });
    const byHour = new Array(24).fill(0);
    for (const e of events) {
      const h = new Date(e.timestamp).getUTCHours();
      byHour[h]++;
    }
    const sorted = byHour.map((c, h) => ({ hour: h, count: c })).sort((a, b) => b.count - a.count);
    return { recommended: sorted.slice(0, 5).map((x) => ({ hour: x.hour, label: `${x.hour}:00 UTC` })), byHour };
  }

  /** 11.1 Trending audio */
  async getTrendingAudio(genre?: string, limit = 20) {
    const where = genre ? { genre } : {};
    const list = await prisma.trendingAudio.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: limit,
    });
    return { items: list };
  }

  /** 11.2 Content ideas (rule-based suggestions by niche) */
  async getContentIdeas(accountId: string, niche?: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { businessCategory: true },
    });
    const category = niche || account?.businessCategory || 'General';
    const ideas: { format: string; topic: string; description: string }[] = [];
    const topicsByCategory: Record<string, string[][]> = {
      Photography: [['Behind-the-scenes', 'Reel'], ['Editing tutorial', 'Reel'], ['Gear review', 'Post'], ['Location guide', 'Post']],
      Gaming: [['Highlight clip', 'Reel'], ['Reaction to patch', 'Reel'], ['Stream schedule', 'Story'], ['Collab announcement', 'Post']],
      Fitness: [['Quick workout', 'Reel'], ['Form tip', 'Reel'], ['Meal prep', 'Post'], ['Progress check', 'Story']],
      Music: [['Acoustic snippet', 'Reel'], ['Cover', 'Reel'], ['Studio day', 'Story'], ['Release teaser', 'Post']],
      Beauty: [['Tutorial', 'Reel'], ['Get ready with me', 'Reel'], ['Product review', 'Post'], ['Routine', 'Story']],
      Food: [['Recipe', 'Reel'], ['Taste test', 'Reel'], ['Restaurant review', 'Post'], ['Cooking tip', 'Story']],
      General: [['Day in the life', 'Story'], ['Q&A', 'Story'], ['Tip or hack', 'Reel'], ['Throwback', 'Post']],
    };
    const topics = topicsByCategory[category] || topicsByCategory.General;
    for (let i = 0; i < Math.min(6, topics.length); i++) {
      const [topic, format] = topics[i];
      ideas.push({ format, topic, description: `Create a ${format.toLowerCase()} about ${topic.toLowerCase()}` });
    }
    return { ideas, category };
  }

  /** 12.2 Creator network */
  async listCreatorNetwork(accountId: string, niche?: string, status?: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true, businessCategory: true },
    });
    if (!account || (account.accountType !== 'CREATOR' && account.accountType !== 'BUSINESS'))
      throw new AppError('Creator network is for creators only', 403);
    const connections = await prisma.creatorConnection.findMany({
      where: { OR: [{ creatorId: accountId }, { peerId: accountId }], ...(status && { status }) },
      include: {
        creator: { select: { id: true, username: true, displayName: true, profilePhoto: true, businessCategory: true } },
        peer: { select: { id: true, username: true, displayName: true, profilePhoto: true, businessCategory: true } },
      },
    });
    const list = connections.map((c) => ({
      id: c.id,
      status: c.status,
      incoming: c.peerId === accountId,
      other: c.creatorId === accountId ? c.peer : c.creator,
      createdAt: c.createdAt,
    }));
    return { connections: list };
  }

  async sendCreatorConnectionRequest(accountId: string, peerId: string) {
    if (accountId === peerId) throw new AppError('Cannot connect to yourself', 400);
    const existing = await prisma.creatorConnection.findUnique({
      where: { creatorId_peerId: { creatorId: accountId, peerId } },
    });
    if (existing) throw new AppError('Already sent or connected', 400);
    return prisma.creatorConnection.create({
      data: { creatorId: accountId, peerId, status: 'PENDING' },
      include: { peer: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
  }

  async acceptCreatorConnection(accountId: string, id: string) {
    const conn = await prisma.creatorConnection.findFirst({ where: { id, peerId: accountId } });
    if (!conn) throw new AppError('Connection request not found', 404);
    return prisma.creatorConnection.update({
      where: { id },
      data: { status: 'ACCEPTED' },
      include: { creator: { select: { id: true, username: true, displayName: true } } },
    });
  }

  /** 12.3 Brand marketplace */
  async listBrandCampaigns(niche?: string, limit = 20) {
    const where = niche ? { status: 'OPEN', niche } : { status: 'OPEN' };
    const campaigns = await prisma.brandCampaign.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
    return { campaigns };
  }

  async applyToBrandCampaign(accountId: string, campaignId: string, message?: string) {
    const campaign = await prisma.brandCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== 'OPEN') throw new AppError('Campaign not found or closed', 404);
    const existing = await prisma.brandCampaignApplication.findUnique({
      where: { campaignId_creatorId: { campaignId, creatorId: accountId } },
    });
    if (existing) throw new AppError('Already applied', 400);
    return prisma.brandCampaignApplication.create({
      data: { campaignId, creatorId: accountId, message: message?.slice(0, 500) ?? null },
      include: { campaign: { select: { title: true, status: true } } },
    });
  }

  async listMyCampaignApplications(accountId: string) {
    const list = await prisma.brandCampaignApplication.findMany({
      where: { creatorId: accountId },
      include: { campaign: { select: { id: true, title: true, status: true, niche: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { applications: list };
  }

  /** List applications to my campaigns (brand side): pending and approved for approve/decline UI. */
  async listBrandCampaignApplications(brandId: string, status?: 'PENDING' | 'ACCEPTED' | 'REJECTED') {
    const where: { campaign: { brandId: string }; status?: string } = { campaign: { brandId } };
    if (status) where.status = status;
    const list = await prisma.brandCampaignApplication.findMany({
      where,
      include: {
        campaign: { select: { id: true, title: true } },
        creator: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { applications: list };
  }

  async approveBrandCampaignApplication(brandId: string, applicationId: string) {
    const app = await prisma.brandCampaignApplication.findUnique({
      where: { id: applicationId },
      include: { campaign: { select: { brandId: true } } },
    });
    if (!app || app.campaign.brandId !== brandId) throw new AppError('Application not found', 404);
    if (app.status !== 'PENDING') throw new AppError('Application already processed', 400);
    return prisma.brandCampaignApplication.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
      include: { creator: { select: { id: true, username: true, displayName: true } } },
    });
  }

  async declineBrandCampaignApplication(brandId: string, applicationId: string) {
    const app = await prisma.brandCampaignApplication.findUnique({
      where: { id: applicationId },
      include: { campaign: { select: { brandId: true } } },
    });
    if (!app || app.campaign.brandId !== brandId) throw new AppError('Application not found', 404);
    if (app.status !== 'PENDING') throw new AppError('Application already processed', 400);
    return prisma.brandCampaignApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' },
      include: { creator: { select: { id: true, username: true, displayName: true } } },
    });
  }

  /** 9.4 Reel bonus (creator view) */
  async listMyReelBonuses(accountId: string) {
    const list = await prisma.reelBonus.findMany({
      where: { creatorId: accountId },
      orderBy: { month: 'desc' },
      take: 12,
    });
    return { bonuses: list };
  }
}
