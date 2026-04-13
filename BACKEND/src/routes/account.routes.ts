import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { AccountService } from '../services/account.service';
import { EmailService } from '../services/email.service';
import { HighlightService } from '../services/highlight.service';
import { ReviewService } from '../services/review.service';
import { CreatorSubscriptionService } from '../services/creatorSubscription.service';
import { MessageService } from '../services/message.service';
import { DataExportService } from '../services/dataExport.service';
import { prisma } from '../server';
import { normalizeUsername, validateUsernameFormat } from '../utils/usernameValidation';
import { listAccountActivityLogs, listHiddenWordModerationLogs } from '../services/activity.service';

const router = Router();
const dataExportService = new DataExportService();
const accountService = new AccountService();
const emailService = new EmailService();
const highlightService = new HighlightService();
const reviewService = new ReviewService();
const creatorSubscriptionService = new CreatorSubscriptionService();
const messageService = new MessageService();

// Instagram-style username availability check (used by frontend EditUsernamePage).
// GET /accounts/check-username?username=...
router.get('/check-username', optionalAuthenticate, async (req, res, next) => {
  try {
    const q = req.query.username;
    if (typeof q !== 'string' || !q.trim()) {
      return res.json({ available: false, error: 'Username is required' });
    }
    const username = normalizeUsername(q);
    const validation = validateUsernameFormat(username);
    if (!validation.valid) return res.json({ available: false, error: validation.message });

    const taken = await prisma.account.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    return res.json({ available: !taken });
  } catch (e) {
    next(e);
  }
});

/** GET /accounts/lookup?phoneNumber=... or email=... or username=...
 * Used for emergency contacts: resolve a MOxE account by phone/email/username.
 */
router.get('/lookup', authenticate, async (req, res, next) => {
  try {
    const phoneNumberQ = req.query.phoneNumber;
    const emailQ = req.query.email;
    const usernameQ = req.query.username;

    const phoneNumber = typeof phoneNumberQ === 'string' ? phoneNumberQ.trim() : '';
    const email = typeof emailQ === 'string' ? emailQ.trim() : '';
    const username = typeof usernameQ === 'string' ? usernameQ.trim() : '';

    if (!phoneNumber && !email && !username) {
      return res.status(400).json({ error: 'phoneNumber, email, or username required' });
    }

    function normalizePhone(phone: string): string {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) return `+1${digits}`;
      if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
      if (phone.startsWith('+')) return phone;
      return `+${digits}`;
    }

    if (phoneNumber) {
      const normalized = normalizePhone(phoneNumber);
      const accounts = await prisma.account.findMany({
        where: { user: { phoneNumber: normalized } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, username: true, displayName: true, accountType: true },
      });
      if (!accounts.length) return res.status(404).json({ error: 'Account not found' });
      const account = accounts.find((a) => a.accountType === 'PERSONAL') ?? accounts[0];
      return res.json({ account });
    }

    if (email) {
      const accounts = await prisma.account.findMany({
        where: { user: { email: { equals: email, mode: 'insensitive' } } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, username: true, displayName: true, accountType: true },
      });
      if (!accounts.length) return res.status(404).json({ error: 'Account not found' });
      const account = accounts.find((a) => a.accountType === 'PERSONAL') ?? accounts[0];
      return res.json({ account });
    }

    // Username fallback
    if (username) {
      const normalizedUsername = normalizeUsername(username);
      const account = await accountService.getAccountByUsername(normalizedUsername);
      return res.json({ account });
    }

    return res.status(400).json({ error: 'Invalid lookup request' });
  } catch (e) {
    next(e);
  }
});

/** GET /accounts/me — Instagram-style current account: { account, capabilities }. account: id, username, displayName?, bio?, avatarUrl?, isPrivate, accountType, postCount?, followerCount?, followingCount?, etc. capabilities: canPost, canCommerce, ... */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const bundle = await accountService.getMeBundle(accountId);
    res.json(bundle);
  } catch (e) {
    next(e);
  }
});

router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await accountService.updateAccount(accountId, req.body ?? {});
    const account = await accountService.getAccountById(accountId);
    res.json({ account });
  } catch (e) {
    next(e);
  }
});

router.patch('/me/email', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    const userId = (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({ where: { id: accountId }, select: { userId: true } });
    if (!account) return res.status(401).json({ error: 'Unauthorized' });
    const uid = userId || account.userId;
    const { email } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' });
    const result = await emailService.requestVerification(uid, email);
    res.status(202).json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/me/profile-visitors', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await accountService.getProfileVisitors(accountId);
    res.json({ visitors: list });
  } catch (e) {
    next(e);
  }
});

/** GET /accounts/me/storage-usage — Storage used for capability/UI (e.g. StorageIndicator). */
router.get('/me/storage-usage', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { storageBytesUsed: true },
    });
    const bytes = account?.storageBytesUsed ?? 0;
    res.json({ usedGB: bytes / (1024 * 1024 * 1024), usedBytes: bytes });
  } catch (e) {
    next(e);
  }
});

/** GET /accounts/me/activity — Profile/history events (username, bio, privacy, account type from AccountActivityLog). */
router.get('/me/activity', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { items } = await listAccountActivityLogs(accountId);
    res.json({
      items: items.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        createdAt: row.createdAt,
        metadata: row.metadata,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /accounts/me/hidden-word-moderation — Paged safety moderation audit (Safety Center).
 * Query: limit (default 20, max 100), cursor (previous nextCursor), type (comma-separated subset of hidden_word_filter_* / limit_interaction_*).
 */
router.get('/me/hidden-word-moderation', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limitRaw = parseInt(String(req.query.limit ?? ''), 10);
    const limit = Number.isNaN(limitRaw) ? undefined : limitRaw;
    const cursorId = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const typeParam = typeof req.query.type === 'string' ? req.query.type : '';
    const types = typeParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const result = await listHiddenWordModerationLogs(accountId, {
      limit,
      cursorId,
      types: types.length ? types : undefined,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Per-type notification preferences (Guide 1.7). */
router.get('/me/notification-preferences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const prefs = await accountService.getNotificationPreferences(accountId);
    res.json(prefs);
  } catch (e) {
    next(e);
  }
});
router.patch('/me/notification-preferences', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const prefs = await accountService.updateNotificationPreferences(accountId, req.body);
    res.json(prefs);
  } catch (e) {
    next(e);
  }
});

/** Fine-grained MOxE client settings (notification sub-screens, daily limit, language). */
router.get('/me/client-settings', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const settings = await accountService.getClientSettings(accountId);
    res.json({ settings });
  } catch (e) {
    next(e);
  }
});

router.patch('/me/client-settings', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const settings = await accountService.patchClientSettings(accountId, body as Record<string, unknown>);
    res.json({ settings });
  } catch (e) {
    next(e);
  }
});

/** Creator subscription tiers (Section 9.1.1): get/set my offered tiers and welcome message. */
router.get('/me/subscription-tiers', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await creatorSubscriptionService.getTiersWithWelcome(accountId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});
router.patch('/me/subscription-tiers', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const tiers = await creatorSubscriptionService.setTiers(
      accountId,
      req.body.tiers ?? [],
      req.body.welcomeMessage
    );
    const data = await creatorSubscriptionService.getTiersWithWelcome(accountId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

/** My subscriptions (as subscriber). */
router.get('/me/subscriptions', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await creatorSubscriptionService.listMySubscriptions(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** My subscribers (as creator). */
router.get('/me/subscribers', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await creatorSubscriptionService.listSubscribers(accountId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** Export subscribers as CSV (Section 9.1.3). */
router.get('/me/subscribers/export', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const csv = await creatorSubscriptionService.exportSubscribersCsv(accountId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

/** POST /accounts/me/data-export — GDPR/CCPA data portability. Returns structured JSON of profile, posts metadata, follows, likes, saved posts, collections, comments, messages metadata, notifications metadata. */
router.post('/me/data-export', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = await dataExportService.exportAccountData(accountId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="moxe-data-export.json"');
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.get('/list', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const accounts = await accountService.listAccountsByUser(userId);
    res.json(accounts);
  } catch (e) {
    next(e);
  }
});

router.get('/capabilities', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const capabilities = await accountService.getCapabilities(accountId);
    res.json(capabilities);
  } catch (e) {
    next(e);
  }
});

router.get('/:accountId/highlights', optionalAuthenticate, async (req, res, next) => {
  try {
    const list = await highlightService.list(req.params.accountId);
    res.json({ highlights: list });
  } catch (e) {
    next(e);
  }
});

/** Public: creator's subscription tiers. */
router.get('/:creatorId/subscription-tiers', optionalAuthenticate, async (req, res, next) => {
  try {
    const tiers = await creatorSubscriptionService.getTiers(req.params.creatorId);
    res.json({ tiers });
  } catch (e) {
    next(e);
  }
});

/** Subscribe to creator (tierKey in body). Sends welcome DM if creator set one (Guide 9.1.1). */
router.post('/:creatorId/subscribe', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const creatorId = req.params.creatorId;
    const result = await creatorSubscriptionService.subscribe(accountId, creatorId, req.body.tierKey ?? '');
    const welcome = await creatorSubscriptionService.getWelcomeMessage(creatorId);
    if (welcome?.trim()) {
      messageService.send(creatorId, accountId, welcome.trim(), 'TEXT').catch(() => {});
    }
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Unsubscribe from a creator (Guide 9.1.3 cancelSubscription). */
router.post('/:creatorId/unsubscribe', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await creatorSubscriptionService.unsubscribe(accountId, req.params.creatorId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Broadcast message to all subscribers (Guide 9.1.3 sendSubscriberMessage). */
router.post('/me/subscribers/broadcast', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'message required' });
    const { subscribers } = await creatorSubscriptionService.listSubscribers(accountId);
    let sent = 0;
    for (const sub of subscribers) {
      const recipientId = (sub as any).subscriber?.id;
      if (recipientId && recipientId !== accountId) {
        try {
          await messageService.send(accountId, recipientId, message, 'TEXT');
          sent++;
        } catch {
          // skip blocked / invalid
        }
      }
    }
    res.json({ sent, total: subscribers.length });
  } catch (e) {
    next(e);
  }
});

router.get('/:accountId', optionalAuthenticate, async (req, res, next) => {
  try {
    const account = await accountService.getAccountById(req.params.accountId);
    const viewerId = (req as any).user?.accountId;
    if (viewerId && viewerId !== req.params.accountId) {
      accountService.recordProfileView(viewerId, req.params.accountId).catch(() => {});
    }
    res.json(account);
  } catch (e) {
    next(e);
  }
});

router.get('/username/:username', optionalAuthenticate, async (req, res, next) => {
  try {
    const account = await accountService.getAccountByUsername(req.params.username);
    const payload = account as Record<string, unknown>;
    if (account.accountType === 'BUSINESS') {
      const { rating, reviewsCount } = await reviewService.getRatingForSeller(account.id);
      payload.rating = rating;
      payload.reviewsCount = reviewsCount;
    }
    const [postCount, followersCount, followingCount] = await Promise.all([
      prisma.post.count({ where: { accountId: account.id } }),
      prisma.follow.count({ where: { followingId: account.id } }),
      prisma.follow.count({ where: { followerId: account.id } }),
    ]);
    payload.postsCount = postCount;
    payload.postCount = postCount;
    payload.followersCount = followersCount;
    payload.followerCount = followersCount;
    payload.followingCount = followingCount;
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await accountService.createAccount(userId, req.body);
    res.status(201).json(account);
  } catch (e) {
    next(e);
  }
});

router.patch('/:accountId', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId || accountId !== req.params.accountId) return res.status(403).json({ error: 'Forbidden' });
    const account = await accountService.updateAccount(req.params.accountId, req.body);
    res.json(account);
  } catch (e) {
    next(e);
  }
});

router.post('/:accountId/upgrade', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId || accountId !== req.params.accountId) return res.status(403).json({ error: 'Forbidden' });
    const result = await accountService.upgradeSubscription(accountId, req.body.tier);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
