import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../server';
import { NotificationService } from '../services/notification.service';

const router = Router();
const notifications = new NotificationService();

router.post('/', authenticate, async (req, res, next) => {
  try {
    const brandId = (req as any).user?.accountId as string | undefined;
    if (!brandId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: brandId },
      select: { accountType: true },
    });
    if (account?.accountType !== 'BUSINESS') {
      return res.status(403).json({ error: 'Only business accounts can create campaigns' });
    }
    const { title, description, budget, compensation, requirements, category, startDate, endDate } = req.body as any;
    if (!title || !category || !startDate || !endDate) {
      return res.status(400).json({ error: 'title, category, startDate, endDate are required' });
    }
    const campaign = await prisma.campaign.create({
      data: {
        brandId,
        title: String(title).slice(0, 120),
        description: description ? String(description).slice(0, 3000) : null,
        budget: Math.max(0, Math.round(Number(budget || 0) * 100)),
        compensation: Math.max(0, Math.round(Number(compensation || 0) * 100)),
        requirements: requirements && typeof requirements === 'object' ? requirements : null,
        category: String(category).slice(0, 80),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
    res.status(201).json(campaign);
  } catch (e) {
    next(e);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const me = await prisma.account.findUnique({ where: { id: accountId }, select: { accountType: true } });
    if (!me) return res.status(404).json({ error: 'Account not found' });
    let whereClause: any;
    if (me.accountType === 'CREATOR') {
      whereClause = { status: 'active', endDate: { gt: new Date() } };
    } else if (me.accountType === 'BUSINESS') {
      whereClause = { brandId: accountId };
    } else {
      return res.status(403).json({ error: 'Not eligible to view campaigns' });
    }
    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        brand: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        applications: me.accountType === 'CREATOR' ? { where: { creatorId: accountId } } : true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        brand: { select: { id: true, username: true, displayName: true, profilePhoto: true, accountType: true } },
        applications: {
          include: { creator: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/apply', authenticate, async (req, res, next) => {
  try {
    const creatorId = (req as any).user?.accountId as string | undefined;
    if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });
    const me = await prisma.account.findUnique({
      where: { id: creatorId },
      select: { accountType: true, username: true },
    });
    if (me?.accountType !== 'CREATOR') {
      return res.status(403).json({ error: 'Only creator accounts can apply' });
    }
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'active') return res.status(400).json({ error: 'Campaign not accepting applications' });
    const message = typeof req.body?.message === 'string' ? req.body.message.slice(0, 500) : null;
    const application = await prisma.application.upsert({
      where: { campaignId_creatorId: { campaignId: campaign.id, creatorId } },
      create: { campaignId: campaign.id, creatorId, message, status: 'pending' },
      update: { message, status: 'pending' },
    });
    await notifications.create(
      campaign.brandId,
      'CAMPAIGN_APPLICATION',
      creatorId,
      `${me.username ?? 'A creator'} applied to "${campaign.title}"`,
      { campaignId: campaign.id, applicationId: application.id }
    );
    res.status(201).json(application);
  } catch (e) {
    next(e);
  }
});

router.patch('/applications/:id', authenticate, async (req, res, next) => {
  try {
    const brandId = (req as any).user?.accountId as string | undefined;
    if (!brandId) return res.status(401).json({ error: 'Unauthorized' });
    const status = String(req.body?.status || '').toLowerCase();
    if (!['pending', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { campaign: true },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.campaign.brandId !== brandId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status },
    });
    await notifications.create(
      application.creatorId,
      'CAMPAIGN_APPLICATION',
      brandId,
      `Your application for "${application.campaign.title}" was ${status}`,
      { campaignId: application.campaignId, applicationId: application.id, status }
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
