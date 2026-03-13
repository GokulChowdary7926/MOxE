/**
 * Business account-only routes: promotions, team, quick replies, verification.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PromotionService } from '../services/promotion.service';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const router = Router();
const promotionService = new PromotionService();

/** Business account only (no Creator). Use for all /api/business/* routes. */
const ensureBusiness = async (req: any) => {
  const accountId = req.user?.accountId;
  if (!accountId) throw new AppError('Unauthorized', 401);
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { accountType: true },
  });
  if (!account || account.accountType !== 'BUSINESS')
    throw new AppError('Business account required', 403);
  return accountId;
};

// ---------- Promotions ----------
router.get('/promotions', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const list = await promotionService.list(accountId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/promotions', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const promo = await promotionService.create(accountId, req.body);
    res.status(201).json(promo);
  } catch (e) {
    next(e);
  }
});

router.get('/promotions/:promotionId', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const promo = await promotionService.getOne(accountId, req.params.promotionId);
    res.json(promo);
  } catch (e) {
    next(e);
  }
});

router.patch('/promotions/:promotionId', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const promo = await promotionService.update(accountId, req.params.promotionId, req.body);
    res.json(promo);
  } catch (e) {
    next(e);
  }
});

router.delete('/promotions/:promotionId', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    await promotionService.delete(accountId, req.params.promotionId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/promotions/:promotionId/performance', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const perf = await promotionService.getPerformance(accountId, req.params.promotionId);
    res.json(perf);
  } catch (e) {
    next(e);
  }
});

/** Record mock ad event (IMPRESSION or CLICK). Call when showing/clicking boosted content. */
router.post('/promotions/:promotionId/record-event', authenticate, async (req, res, next) => {
  try {
    const viewerId = (req as any).user?.accountId;
    const eventType = req.body?.eventType === 'CLICK' ? 'CLICK' : 'IMPRESSION';
    await promotionService.recordEvent(req.params.promotionId, eventType, viewerId);
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------- Team members ----------
router.get('/team', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const members = await prisma.businessMember.findMany({
      where: { businessAccountId: accountId },
      include: {
        memberAccount: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    res.json(members);
  } catch (e) {
    next(e);
  }
});

router.post('/team/invite', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const { memberAccountId, role } = req.body;
    if (!memberAccountId) throw new AppError('memberAccountId required', 400);
    const existing = await prisma.businessMember.findUnique({
      where: {
        businessAccountId_memberAccountId: { businessAccountId: accountId, memberAccountId },
      },
    });
    if (existing) throw new AppError('Already a team member', 400);
    const member = await prisma.businessMember.create({
      data: {
        businessAccountId: accountId,
        memberAccountId,
        role: role || 'MEMBER',
        joinedAt: new Date(),
        invitedBy: accountId,
      },
      include: {
        memberAccount: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    await prisma.businessTeamActivity.create({
      data: { businessAccountId: accountId, actorId: accountId, action: 'INVITE', targetType: 'member', targetId: member.id, metadata: { memberAccountId, role: role || 'MEMBER' } },
    });
    res.status(201).json(member);
  } catch (e) {
    next(e);
  }
});

router.patch('/team/:memberId', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const { role } = req.body;
    const member = await prisma.businessMember.findFirst({
      where: { id: req.params.memberId, businessAccountId: accountId },
    });
    if (!member) throw new AppError('Team member not found', 404);
    const updated = await prisma.businessMember.update({
      where: { id: req.params.memberId },
      data: role ? { role } : {},
      include: {
        memberAccount: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    if (role) {
      await prisma.businessTeamActivity.create({
        data: { businessAccountId: accountId, actorId: accountId, action: 'ROLE_CHANGE', targetType: 'member', targetId: req.params.memberId, metadata: { role, memberAccountId: member.memberAccountId } },
      });
    }
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/team/:memberId', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const member = await prisma.businessMember.findFirst({
      where: { id: req.params.memberId, businessAccountId: accountId },
    });
    if (!member) throw new AppError('Team member not found', 404);
    await prisma.businessTeamActivity.create({
      data: { businessAccountId: accountId, actorId: accountId, action: 'REMOVE', targetType: 'member', targetId: req.params.memberId, metadata: { memberAccountId: member.memberAccountId } },
    });
    await prisma.businessMember.delete({ where: { id: req.params.memberId } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/team/activity', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const activities = await prisma.businessTeamActivity.findMany({
      where: { businessAccountId: accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json(activities);
  } catch (e) {
    next(e);
  }
});

// ---------- Quick replies ----------
router.get('/quick-replies', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const list = await prisma.businessQuickReply.findMany({
      where: { accountId },
      orderBy: { order: 'asc' },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/quick-replies', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const { shortcut, message } = req.body;
    if (!shortcut || !message) throw new AppError('shortcut and message required', 400);
    const reply = await prisma.businessQuickReply.create({
      data: { accountId, shortcut: String(shortcut).slice(0, 50), message: String(message).slice(0, 500) },
    });
    res.status(201).json(reply);
  } catch (e) {
    next(e);
  }
});

router.patch('/quick-replies/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const existing = await prisma.businessQuickReply.findFirst({
      where: { id: req.params.id, accountId },
    });
    if (!existing) throw new AppError('Quick reply not found', 404);
    const { shortcut, message, order } = req.body;
    const reply = await prisma.businessQuickReply.update({
      where: { id: req.params.id },
      data: {
        ...(shortcut != null && { shortcut: String(shortcut).slice(0, 50) }),
        ...(message != null && { message: String(message).slice(0, 500) }),
        ...(order != null && { order: Number(order) }),
      },
    });
    res.json(reply);
  } catch (e) {
    next(e);
  }
});

router.delete('/quick-replies/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const existing = await prisma.businessQuickReply.findFirst({
      where: { id: req.params.id, accountId },
    });
    if (!existing) throw new AppError('Quick reply not found', 404);
    await prisma.businessQuickReply.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------- Verification ----------
router.get('/verification', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { verifiedBadge: true, verifiedAt: true },
    });
    const request = await prisma.verificationRequest.findFirst({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ account: { verifiedBadge: account?.verifiedBadge, verifiedAt: account?.verifiedAt }, request });
  } catch (e) {
    next(e);
  }
});

router.post('/verification/request', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { verifiedBadge: true },
    });
    if (account?.verifiedBadge) throw new AppError('Account is already verified', 400);
    const pending = await prisma.verificationRequest.findFirst({
      where: { accountId, status: 'PENDING' },
    });
    if (pending) throw new AppError('You already have a pending verification request', 400);
    const doc = await prisma.verificationRequest.create({
      data: { accountId, documentUrl: req.body.documentUrl || null, notes: req.body.notes || null },
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

// ---------- Scheduled content (Section 6) ----------
router.get('/scheduled', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const [posts, reels] = await Promise.all([
      prisma.post.findMany({
        where: { accountId, isScheduled: true, isDeleted: false, scheduledFor: { gte: new Date() } },
        select: { id: true, caption: true, media: true, scheduledFor: true, contentType: true },
        orderBy: { scheduledFor: 'asc' },
      }),
      prisma.reel.findMany({
        where: { accountId, isScheduled: true, scheduledFor: { gte: new Date() } },
        select: { id: true, caption: true, thumbnail: true, scheduledFor: true },
        orderBy: { scheduledFor: 'asc' },
      }),
    ]);
    const items = [
      ...posts.map((p) => ({ type: 'post' as const, id: p.id, caption: p.caption, media: p.media, scheduledFor: p.scheduledFor })),
      ...reels.map((r) => ({ type: 'reel' as const, id: r.id, caption: r.caption, thumbnail: r.thumbnail, scheduledFor: r.scheduledFor })),
    ].sort((a, b) => new Date(a.scheduledFor ?? 0).getTime() - new Date(b.scheduledFor ?? 0).getTime());
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// ---------- Promotions calendar (Section 10: upcoming promotions + scheduled) ----------
router.get('/calendar', authenticate, async (req, res, next) => {
  try {
    const accountId = await ensureBusiness(req);
    const [promotions, posts, reels] = await Promise.all([
      prisma.promotion.findMany({
        where: { accountId, status: 'ACTIVE' },
        select: { id: true, name: true, startAt: true, endAt: true, status: true },
      }),
      prisma.post.findMany({
        where: { accountId, isScheduled: true, isDeleted: false, scheduledFor: { gte: new Date() } },
        select: { id: true, caption: true, scheduledFor: true },
        orderBy: { scheduledFor: 'asc' },
        take: 50,
      }),
      prisma.reel.findMany({
        where: { accountId, isScheduled: true, scheduledFor: { gte: new Date() } },
        select: { id: true, caption: true, scheduledFor: true },
        orderBy: { scheduledFor: 'asc' },
        take: 50,
      }),
    ]);
    res.json({
      promotions: promotions.filter((p) => p.startAt || p.endAt),
      scheduledPosts: posts,
      scheduledReels: reels,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
