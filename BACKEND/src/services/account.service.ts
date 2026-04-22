import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { ReviewService } from './review.service';
import { normalizeUsername, validateDisplayNameFormat, validateUsernameFormat } from '../utils/usernameValidation';
import { AccountType as PrismaAccountType, SubscriptionTier as PrismaTier } from '@prisma/client';
import { getCapabilities, type AccountType, type SubscriptionTier } from '../constants/capabilities';

const TYPE_MAP: Record<string, PrismaAccountType> = {
  PERSONAL: 'PERSONAL',
  BUSINESS: 'BUSINESS',
  CREATOR: 'CREATOR',
  JOB: 'JOB',
};
const TIER_MAP: Record<string, PrismaTier> = {
  FREE: 'FREE',
  STAR: 'STAR',
  THICK: 'THICK',
};

export class AccountService {
  async getAccountById(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: { select: { id: true, phoneNumber: true, email: true, emailVerified: true, isVerified: true, dateOfBirth: true } },
        links: { orderBy: { order: 'asc' } },
      },
    });
    if (!account) throw new AppError('Account not found', 404);
    return account;
  }

  async getAccountByUsername(username: string) {
    const account = await prisma.account.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      include: {
        user: { select: { id: true, isVerified: true } },
        links: { orderBy: { order: 'asc' } },
      },
    });
    if (!account) throw new AppError('Account not found', 404);
    return account;
  }

  async listAccountsByUser(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      include: { links: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    return accounts.map((a) => ({
      ...a,
      capabilities: getCapabilities(
        a.accountType as AccountType,
        a.subscriptionTier as SubscriptionTier
      ),
    }));
  }

  async getCapabilities(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { accountType: true, subscriptionTier: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    return getCapabilities(
      account.accountType as AccountType,
      account.subscriptionTier as SubscriptionTier
    );
  }

  /**
   * Shared payload for GET /accounts/me and GET /users/me — { account, capabilities } with counts and business rating.
   */
  async getMeBundle(accountId: string): Promise<{
    account: Record<string, unknown>;
    capabilities: ReturnType<typeof getCapabilities>;
  }> {
    const account = await this.getAccountById(accountId);
    const capabilities = await this.getCapabilities(accountId);
    const accountPayload = { ...account } as unknown as Record<string, unknown>;
    if (account.accountType === 'BUSINESS') {
      try {
        const reviewService = new ReviewService();
        const { rating, reviewsCount } = await reviewService.getRatingForSeller(account.id);
        accountPayload.rating = rating;
        accountPayload.reviewsCount = reviewsCount;
      } catch (err) {
        console.warn('[AccountService.getMeBundle] seller rating skipped', err);
        accountPayload.rating = null;
        accountPayload.reviewsCount = 0;
      }
    }
    const [postCount, followersCount, followingCount] = await Promise.all([
      prisma.post.count({ where: { accountId } }),
      prisma.follow.count({ where: { followingId: accountId } }),
      prisma.follow.count({ where: { followerId: accountId } }),
    ]);
    accountPayload.postsCount = postCount;
    accountPayload.postCount = postCount;
    accountPayload.followersCount = followersCount;
    accountPayload.followerCount = followersCount;
    accountPayload.followingCount = followingCount;
    const adminIds = (process.env.ADMIN_ACCOUNT_IDS || '').trim().split(',').filter(Boolean);
    accountPayload.isPlatformAdmin = adminIds.length > 0 && adminIds.includes(accountId);
    return { account: accountPayload, capabilities };
  }

  /** Guide: 2 business/creator + 1 personal, or 2 job + 1 personal (max 3 accounts). */
  private async isValidAccountCombination(userId: string, newType: PrismaAccountType, updatingAccountId?: string): Promise<boolean> {
    const existing = await prisma.account.findMany({
      where: { userId },
      select: { id: true, accountType: true },
    });
    const types = updatingAccountId
      ? existing.map((a) => (a.id === updatingAccountId ? newType : a.accountType))
      : [...existing.map((a) => a.accountType), newType];
    if (types.length > 3) return false;
    if (!types.includes('PERSONAL')) return false;
    const personal = types.filter((t) => t === 'PERSONAL').length;
    if (personal > 1) return false;
    const businessOrCreator = types.filter((t) => t === 'BUSINESS' || t === 'CREATOR').length;
    if (businessOrCreator > 2) return false;
    const job = types.filter((t) => t === 'JOB').length;
    if (job > 2) return false; // Guide: max 2 job accounts per phone
    return true;
  }

  async createAccount(userId: string, data: {
    username: string;
    displayName: string;
    accountType: PrismaAccountType;
    subscriptionTier?: PrismaTier;
    bio?: string;
    profilePhoto?: string;
    pronouns?: string;
    location?: string;
    website?: string;
    isPrivate?: boolean;
    businessCategory?: string;
    businessHours?: object;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    actionButtons?: object;
    professionalHeadline?: string;
    professionalSection?: object;
    personalSection?: object;
    skills?: string[];
    openToOpportunities?: boolean;
    links?: { url: string; title: string; displayText?: string }[];
  }) {
    const count = await prisma.account.count({ where: { userId } });
    if (count >= 3) throw new AppError('Maximum 3 accounts per phone (1 personal + 2 business or creator)', 400);
    const existing = await prisma.account.findUnique({ where: { username: data.username } });
    if (existing) throw new AppError('Username already taken', 400);
    if (!this.isValidAccountCombination(userId, data.accountType))
      throw new AppError('Invalid account type combination. You must have at least one Personal account.', 400);

    let tier: PrismaTier = data.subscriptionTier ?? 'FREE';
    if (data.accountType === 'BUSINESS') tier = 'THICK';
    if (data.accountType === 'CREATOR') tier = 'FREE'; // Creator Free; upgrade to THICK for Creator Paid
    if (data.accountType === 'JOB') tier = 'FREE';
    if (data.accountType === 'PERSONAL' && data.subscriptionTier === 'STAR') tier = 'STAR';

    const account = await prisma.account.create({
      data: {
        userId,
        username: data.username,
        displayName: data.displayName,
        accountType: data.accountType,
        subscriptionTier: tier,
        bio: data.bio,
        profilePhoto: data.profilePhoto,
        pronouns: data.pronouns,
        location: data.location,
        website: data.website,
        isPrivate: data.isPrivate ?? false,
        businessCategory: data.businessCategory,
        businessHours: data.businessHours ?? undefined,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactAddress: data.contactAddress,
        actionButtons: data.actionButtons ?? undefined,
        professionalHeadline: data.professionalHeadline,
        professionalSection: data.professionalSection ?? undefined,
        personalSection: data.personalSection ?? undefined,
        skills: data.skills ?? [],
        openToOpportunities: data.openToOpportunities ?? false,
        subscriptionsEnabled: data.accountType === 'BUSINESS',
        badgesEnabled: data.accountType === 'BUSINESS',
        giftsEnabled: false,
      },
    });

    if (data.links?.length) {
      await Promise.all(
        data.links.slice(0, 5).map((link, order) =>
          prisma.link.create({
            data: {
              accountId: account.id,
              url: link.url,
              title: link.title,
              displayText: link.displayText ?? link.title,
              order,
            },
          })
        )
      );
    }
    const withLinks = await this.getAccountById(account.id);
    return {
      ...withLinks,
      capabilities: getCapabilities(account.accountType as AccountType, account.subscriptionTier as SubscriptionTier),
    };
  }

  async updateAccount(accountId: string, data: Record<string, unknown>) {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AppError('Account not found', 404);
    if (typeof data.username === 'string') {
      const requested = normalizeUsername(data.username);
      const validation = validateUsernameFormat(requested);
      if (!validation.valid) throw new AppError(validation.message, 400);

      const isActualChange = requested.toLowerCase() !== account.username.toLowerCase();
      if (isActualChange) {
        const taken = await prisma.account.findFirst({
          where: {
            id: { not: accountId },
            username: { equals: requested, mode: 'insensitive' },
          },
        });
        if (taken) throw new AppError('Username already taken', 400);

        const changedAt = account.usernameChangedAt ?? account.createdAt;
        const daysSince = (Date.now() - changedAt.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSince < 14) throw new AppError('Username can only be changed once every 14 days', 400);
      }

      // Always store normalized username (no leading @, trimmed).
      (data as any).username = requested;
    }
    if (typeof data.displayName === 'string') {
      const displayNameValidation = validateDisplayNameFormat(data.displayName);
      if (!displayNameValidation.valid) throw new AppError(displayNameValidation.message, 400);
      (data as any).displayName = displayNameValidation.normalized;
    }
    // Account type conversion (e.g. Personal → Business)
    if (data.accountType && data.accountType !== account.accountType) {
      const newType = data.accountType as PrismaAccountType;
      if (!['PERSONAL', 'BUSINESS', 'CREATOR', 'JOB'].includes(newType))
        throw new AppError('Invalid account type', 400);
      if (!(await this.isValidAccountCombination(account.userId, newType, account.id)))
        throw new AppError('Invalid account type combination. You must have at least one Personal account; max 2 Job accounts.', 400);
      if (newType === 'BUSINESS') {
        (data as any).subscriptionTier = 'THICK';
        (data as any).subscriptionsEnabled = true;
        (data as any).badgesEnabled = true;
        (data as any).isPrivate = false;
      }
      if (newType === 'CREATOR') {
        // Creator Free by default; upgrade to THICK (Creator Paid $5) for monetization + Blue Badge
        (data as any).subscriptionTier = 'FREE';
        (data as any).subscriptionsEnabled = false;
        (data as any).badgesEnabled = false;
        (data as any).giftsEnabled = false;
      }
      if (newType === 'JOB') {
        // Job: guide says paid-only $10/mo; default to FREE on convert, user upgrades for Purple Badge + full tools
        (data as any).subscriptionTier = 'FREE';
        (data as any).isPrivate = false;
      }
    }
    const allowed = [
      'displayName', 'username', 'bio', 'profilePhoto', 'coverPhoto', 'pronouns', 'location', 'website',
      'isPrivate', 'accountType', 'subscriptionTier', 'subscriptionsEnabled', 'badgesEnabled', 'giftsEnabled',
      'businessCategory', 'businessHours', 'contactEmail', 'contactPhone', 'contactBookingLink', 'contactWhatsApp', 'contactAddress',
      'actionButtons', 'subscriptionTierOffers', 'professionalHeadline', 'professionalSection', 'personalSection', 'skills',
      'openToOpportunities', 'workplaceVerified', 'activeProfile',
      'searchVisibility', 'showActivityStatus', 'storyArchiveEnabled', 'hideProfileVisits',
      'defaultStoryAllowReplies', 'defaultStoryAllowReshares',
      'quietModeEnabled', 'quietModeStart', 'quietModeEnd', 'quietModeDays',
      'hiddenWords', 'hiddenWordsCommentFilter', 'hiddenWordsDMFilter', 'commentFilterSensitivity',
      'shopBannerUrl', 'featuredProductIds', 'pan', 'gstin', 'bankDetails',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    const effectiveType = ((update.accountType as PrismaAccountType | undefined) ?? account.accountType) as PrismaAccountType;
    if (effectiveType === 'BUSINESS' || effectiveType === 'JOB') {
      // Business/Job profiles are always public in MOxE logic.
      update.isPrivate = false;
    }
    if (data.username && data.username !== account.username) {
      (update as any).usernameChangedAt = new Date();
    }
    await prisma.account.update({
      where: { id: accountId },
      data: update as any,
    });

    try {
      const logs: { type: string; title: string; description: string; metadata?: object }[] = [];
      if (update.username != null && String(update.username) !== account.username) {
        logs.push({
          type: 'username',
          title: 'Username',
          description: `You changed your username to **${String(update.username)}**.`,
          metadata: { oldUsername: account.username, newUsername: String(update.username) },
        });
      }
      if (update.displayName != null && String(update.displayName) !== account.displayName) {
        logs.push({
          type: 'displayName',
          title: 'Name',
          description: 'You updated your display name.',
          metadata: { old: account.displayName, new: String(update.displayName) },
        });
      }
      if (update.bio !== undefined) {
        const nb = update.bio == null ? '' : String(update.bio);
        const ob = account.bio ?? '';
        if (nb !== ob) {
          logs.push({ type: 'bio', title: 'Bio', description: 'You changed your bio.', metadata: {} });
        }
      }
      if (update.isPrivate != null && Boolean(update.isPrivate) !== account.isPrivate) {
        logs.push({
          type: 'privacy',
          title: 'Privacy',
          description: Boolean(update.isPrivate)
            ? 'You set your account to **private**.'
            : 'You set your account to **public**.',
          metadata: { isPrivate: Boolean(update.isPrivate) },
        });
      }
      if (update.accountType != null && String(update.accountType) !== account.accountType) {
        logs.push({
          type: 'accountType',
          title: 'Account type',
          description: `You changed account type to **${String(update.accountType)}**.`,
          metadata: { old: account.accountType, new: String(update.accountType) },
        });
      }
      for (const log of logs) {
        await prisma.accountActivityLog.create({
          data: {
            accountId,
            type: log.type,
            title: log.title,
            description: log.description,
            metadata: log.metadata ?? undefined,
          },
        });
      }
    } catch {
      /* activity log must not fail profile update */
    }

    // Blue Badge gate (4.3): when upgrading to STAR/THICK, grant verifiedBadge if they have an approved verification request
    const newTier = update.subscriptionTier as string | undefined;
    if (newTier === 'STAR' || newTier === 'THICK') {
      const approved = await prisma.verificationRequest.findFirst({
        where: { accountId, status: 'APPROVED' },
      });
      if (approved) {
        await prisma.account.update({
          where: { id: accountId },
          data: { verifiedBadge: true, verifiedAt: new Date() },
        });
      }
    }
    if (data.links !== undefined && Array.isArray(data.links)) {
      await prisma.link.deleteMany({ where: { accountId } });
      const acc = await prisma.account.findUnique({ where: { id: accountId }, select: { accountType: true, subscriptionTier: true } });
      const cap = getCapabilities((acc ?? account).accountType as AccountType, (acc ?? account).subscriptionTier as SubscriptionTier);
      const links = (data.links as { url: string; title: string; displayText?: string; linkCategory?: string }[]).slice(0, cap.maxLinks);
      for (let i = 0; i < links.length; i++) {
        await prisma.link.create({
          data: {
            accountId,
            url: links[i].url,
            title: links[i].title,
            displayText: links[i].displayText ?? links[i].title,
            linkCategory: links[i].linkCategory ?? null,
            order: i,
          },
        });
      }
    }
    return this.getAccountById(accountId);
  }

  async upgradeSubscription(accountId: string, tier: PrismaTier) {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AppError('Account not found', 404);
    const order = { FREE: 0, STAR: 1, THICK: 2 };
    if (order[tier] <= order[account.subscriptionTier]) throw new AppError('Cannot downgrade', 400);
    if (account.accountType !== 'PERSONAL' && tier !== 'THICK')
      throw new AppError('Business/Creator accounts use Thick tier', 400);
    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        subscriptionTier: tier,
        ...(tier === 'THICK' && {
          subscriptionsEnabled: true,
          badgesEnabled: true,
          giftsEnabled: account.accountType === 'CREATOR',
        }),
      },
    });
    return { ...updated, capabilities: getCapabilities(updated.accountType as AccountType, updated.subscriptionTier as SubscriptionTier) };
  }

  async recordProfileView(viewerId: string, profileOwnerId: string): Promise<void> {
    if (viewerId === profileOwnerId) return;
    const viewer = await prisma.account.findUnique({
      where: { id: viewerId },
      select: { hideProfileVisits: true },
    });
    if (viewer?.hideProfileVisits) return;
    await prisma.profileView.create({
      data: { profileOwnerId, viewerId },
    });
  }

  async getProfileVisitors(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true },
    });
    if (!account || account.subscriptionTier !== 'STAR')
      throw new AppError('Profile visitors is a Star tier feature', 403);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const views = await prisma.profileView.findMany({
      where: { profileOwnerId: accountId, viewedAt: { gte: since }, isAnonymous: false },
      orderBy: { viewedAt: 'desc' },
      include: { viewer: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    const byViewer = new Map<string, { viewedAt: Date; count: number; viewer: { id: string; username: string; displayName: string; profilePhoto: string | null } }>();
    for (const v of views) {
      const ex = byViewer.get(v.viewerId);
      if (!ex) byViewer.set(v.viewerId, { viewedAt: v.viewedAt, count: 1, viewer: v.viewer });
      else { ex.count++; if (v.viewedAt > ex.viewedAt) ex.viewedAt = v.viewedAt; }
    }
    return Array.from(byViewer.entries()).map(([viewerId, { viewedAt, count, viewer }]) => ({
      viewerId,
      username: viewer.username,
      displayName: viewer.displayName,
      profilePhoto: viewer.profilePhoto,
      viewedAt: viewedAt.toISOString(),
      viewCount: count,
    }));
  }

  /** Per-type notification preferences (Guide 1.7). Default all true. */
  private static DEFAULT_NOTIFICATION_PREFS = {
    likes: true,
    comments: true,
    dms: true,
    mentions: true,
    follows: true,
    storyReplies: true,
    screenshotAlerts: true,
  };

  async getNotificationPreferences(accountId: string): Promise<Record<string, boolean>> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { notificationPrefs: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    const raw = (account.notificationPrefs as Record<string, boolean> | null) ?? {};
    return { ...AccountService.DEFAULT_NOTIFICATION_PREFS, ...raw };
  }

  async updateNotificationPreferences(
    accountId: string,
    body: Partial<Record<string, boolean>>
  ): Promise<Record<string, boolean>> {
    const allowed = new Set(['likes', 'comments', 'dms', 'mentions', 'follows', 'storyReplies', 'screenshotAlerts']);
    const updates: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(body)) {
      if (allowed.has(k) && typeof v === 'boolean') updates[k] = v;
    }
    if (Object.keys(updates).length === 0) return this.getNotificationPreferences(accountId);
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { notificationPrefs: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    const current = (account.notificationPrefs as Record<string, boolean> | null) ?? {};
    const next = { ...current, ...updates };
    await prisma.account.update({
      where: { id: accountId },
      data: { notificationPrefs: next },
    });
    return this.getNotificationPreferences(accountId);
  }

  async requireCapability(
    accountId: string,
    feature: keyof Omit<import('../constants/capabilities').AccountCapabilities, 'label' | 'description'>
  ) {
    const cap = await this.getCapabilities(accountId);
    const value = (cap as unknown as Record<string, unknown>)[feature];
    if (value === undefined || value === false)
      throw new AppError('Feature not available for this account type', 403);
    return cap;
  }

  /** Deep-merge plain objects (no arrays). Used for clientSettings JSON. */
  private mergePlainObjects(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = { ...a };
    for (const [k, v] of Object.entries(b)) {
      if (v === undefined) continue;
      const prev = out[k];
      if (
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        prev !== null &&
        typeof prev === 'object' &&
        !Array.isArray(prev)
      ) {
        out[k] = this.mergePlainObjects(prev as Record<string, unknown>, v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  async getClientSettings(accountId: string): Promise<Record<string, unknown>> {
    const row = await prisma.account.findUnique({
      where: { id: accountId },
      select: { clientSettings: true },
    });
    if (!row) throw new AppError('Account not found', 404);
    const raw = row.clientSettings;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
    return {};
  }

  async patchClientSettings(accountId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new AppError('Invalid body', 400);
    const row = await prisma.account.findUnique({
      where: { id: accountId },
      select: { clientSettings: true },
    });
    if (!row) throw new AppError('Account not found', 404);
    const current =
      row.clientSettings && typeof row.clientSettings === 'object' && !Array.isArray(row.clientSettings)
        ? (row.clientSettings as Record<string, unknown>)
        : {};
    const next = this.mergePlainObjects(current, patch);
    await prisma.account.update({
      where: { id: accountId },
      data: { clientSettings: next as object },
    });
    return next;
  }
}
