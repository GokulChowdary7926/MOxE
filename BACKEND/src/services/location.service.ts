/**
 * Location: record location for nearby discovery; list nearby accounts.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { ProximityService } from './proximity.service';
import { AnalyticsService } from './analytics.service';

const nearbyAnalytics = new AnalyticsService();

const MAX_RADIUS_M = 50_000;
const DEFAULT_RADIUS_M = 5000;
const LOCATION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const TAG_GEOCODE_LIMIT = 40;
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

/** Nominatim usage policy: avoid bursty requests from the app server. */
let nominatimNextAllowedAt = 0;
const NOMINATIM_MIN_INTERVAL_MS = 1100;

type NominatimSearchRow = {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
};

/** Nearby messaging daily limits (reset at local server midnight). */
export const NEARBY_TEXT_MESSAGES_FREE_PER_DAY = 10;
export const NEARBY_PHOTO_POSTS_FREE_PER_DAY = 1;

function haversineDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class LocationService {
  private async geocodeLocationName(name: string): Promise<{ lat: number; lng: number } | null> {
    const key = name.trim().toLowerCase();
    if (!key) return null;
    if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MOxE/1.0 (location-tag-lookup)',
        },
      });
      const data = (await res.json().catch(() => [])) as Array<{ lat: string; lon: string }>;
      const first = data[0];
      if (!first) {
        geocodeCache.set(key, null);
        return null;
      }
      const coords = { lat: Number(first.lat), lng: Number(first.lon) };
      if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
        geocodeCache.set(key, null);
        return null;
      }
      geocodeCache.set(key, coords);
      return coords;
    } catch {
      geocodeCache.set(key, null);
      return null;
    }
  }

  private async getNetworkAccountIds(
    accountId: string,
    scope: 'followers' | 'following' | 'friends' | 'close_friends',
  ): Promise<string[]> {
    if (scope === 'followers') {
      const rows = await prisma.follow.findMany({
        where: { followingId: accountId },
        select: { followerId: true },
      });
      return rows.map((r) => r.followerId);
    }
    if (scope === 'following') {
      const rows = await prisma.follow.findMany({
        where: { followerId: accountId },
        select: { followingId: true },
      });
      return rows.map((r) => r.followingId);
    }
    if (scope === 'close_friends') {
      const rows = await prisma.closeFriend.findMany({
        where: { accountId },
        select: { friendId: true },
      });
      return rows.map((r) => r.friendId);
    }

    const [followingRows, followerRows] = await Promise.all([
      prisma.follow.findMany({ where: { followerId: accountId }, select: { followingId: true } }),
      prisma.follow.findMany({ where: { followingId: accountId }, select: { followerId: true } }),
    ]);
    const following = new Set(followingRows.map((r) => r.followingId));
    const followers = new Set(followerRows.map((r) => r.followerId));
    return [...following].filter((id) => followers.has(id));
  }

  async updateLocation(accountId: string, data: { latitude: number; longitude: number; accuracy?: number }) {
    const { latitude, longitude, accuracy } = data;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new AppError('latitude and longitude required', 400);
    }
    await prisma.locationHistory.create({
      data: {
        accountId,
        latitude,
        longitude,
        accuracy: typeof accuracy === 'number' ? accuracy : null,
      },
    });
    const proximityService = new ProximityService();
    proximityService.checkAndTrigger(accountId, latitude, longitude).catch(() => {});
    return { ok: true };
  }

  /**
   * Real-time place search via OpenStreetMap Nominatim (lat/lng for map + composer).
   * Optional `bias` prefers results near the user's current map position.
   */
  async searchPlaces(
    query: string,
    limit = 10,
    bias?: { latitude: number; longitude: number },
  ): Promise<
    { id: string; name: string; displayName: string; latitude: number; longitude: number }[]
  > {
    const term = query.trim();
    if (!term) return [];

    const take = Math.min(Math.max(1, limit), 20);
    const now = Date.now();
    if (now < nominatimNextAllowedAt) {
      await new Promise((r) => setTimeout(r, nominatimNextAllowedAt - now));
    }
    nominatimNextAllowedAt = Date.now() + NOMINATIM_MIN_INTERVAL_MS;

    const params = new URLSearchParams({
      format: 'json',
      q: term,
      limit: String(take),
      addressdetails: '0',
      extratags: '0',
      namedetails: '0',
    });

    if (bias) {
      const d = 0.35;
      const west = bias.longitude - d;
      const east = bias.longitude + d;
      const north = bias.latitude + d;
      const south = bias.latitude - d;
      params.set('viewbox', `${west},${north},${east},${south}`);
      params.set('bounded', '0');
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
          'User-Agent': 'MOxE/1.0 (contact: https://github.com)',
        },
      });
      if (!res.ok) return [];
      const data = (await res.json().catch(() => [])) as NominatimSearchRow[];
      if (!Array.isArray(data)) return [];

      return data
        .map((row, i) => {
          const lat = Number(row.lat);
          const lng = Number(row.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const displayName = String(row.display_name || '').trim() || term;
          const shortName = String(row.name || '').trim() || displayName.split(',')[0]?.trim() || term;
          const id = row.place_id != null ? `osm:${row.place_id}` : `osm-i:${i}:${lat.toFixed(4)},${lng.toFixed(4)}`;
          return { id, name: shortName, displayName, latitude: lat, longitude: lng };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);
    } catch {
      return [];
    }
  }

  /** Public posts whose free-text location field matches (for location detail + search). */
  async getPostsByLocationSubstring(query: string, limit = 30) {
    const term = query.trim();
    if (!term) return [];
    const take = Math.min(Math.max(1, limit), 50);
    return prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'PUBLIC',
        location: { contains: term, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
  }

  async getPreferences(accountId: string) {
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      select: { nearbyEnabled: true },
    });
    return { nearbyEnabled: acc?.nearbyEnabled ?? false };
  }

  async setNearbyEnabled(accountId: string, enabled: boolean) {
    await prisma.account.update({
      where: { id: accountId },
      data: { nearbyEnabled: enabled },
    });
    return { nearbyEnabled: enabled };
  }

  /** 3.1 Nearby: daily limit — FREE 1, STAR/THICK 5. Reset at midnight. */
  async getNearby(accountId: string, latitude: number, longitude: number, radiusMeters?: number) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new AppError('latitude and longitude required', 400);
    }
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true, nearbyQueryCountToday: true, nearbyQueryResetAt: true },
    });
    if (!acc) throw new AppError('Account not found', 404);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const needReset = !acc.nearbyQueryResetAt || acc.nearbyQueryResetAt < midnight;
    const count = needReset ? 0 : (acc.nearbyQueryCountToday ?? 0);
    const limit = acc.subscriptionTier === 'FREE' ? 1 : 5;
    if (count >= limit) {
      throw new AppError(`Nearby daily limit reached (${limit}/day). Upgrade for more.`, 429);
    }
    await prisma.account.update({
      where: { id: accountId },
      data: {
        nearbyQueryCountToday: needReset ? 1 : count + 1,
        nearbyQueryResetAt: needReset ? midnight : acc.nearbyQueryResetAt,
      },
    });

    const radius = Math.min(Math.max(Number(radiusMeters) || DEFAULT_RADIUS_M, 100), MAX_RADIUS_M);
    const since = new Date(Date.now() - LOCATION_MAX_AGE_MS);

    const records = await prisma.locationHistory.findMany({
      where: { timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
            nearbyEnabled: true,
          },
        },
      },
    });

    const byAccount = new Map<string, { lat: number; lng: number; account: (typeof records)[0]['account'] }>();
    for (const r of records) {
      if (r.account.id === accountId) continue;
      if (!r.account.nearbyEnabled) continue;
      if (!byAccount.has(r.accountId)) {
        byAccount.set(r.accountId, {
          lat: r.latitude,
          lng: r.longitude,
          account: r.account,
        });
      }
    }

    const results: { accountId: string; username: string; displayName: string; profilePhoto: string | null; distanceMeters: number }[] = [];
    for (const [, v] of byAccount) {
      const dist = haversineDistanceM(latitude, longitude, v.lat, v.lng);
      if (dist <= radius) {
        results.push({
          accountId: v.account.id,
          username: v.account.username,
          displayName: v.account.displayName,
          profilePhoto: v.account.profilePhoto,
          distanceMeters: Math.round(dist),
        });
      }
    }
    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return { accounts: results };
  }

  async getNetworkLocations(
    accountId: string,
    scope: 'followers' | 'following' | 'friends' | 'close_friends',
  ) {
    const targetIds = await this.getNetworkAccountIds(accountId, scope);

    if (targetIds.length === 0) return { locations: [] };

    const since = new Date(Date.now() - LOCATION_MAX_AGE_MS);
    const latest = await prisma.locationHistory.findMany({
      where: {
        accountId: { in: targetIds },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    const byAccount = new Map<string, (typeof latest)[number]>();
    for (const loc of latest) {
      if (!byAccount.has(loc.accountId)) byAccount.set(loc.accountId, loc);
    }

    return {
      locations: [...byAccount.values()].map((loc) => ({
        accountId: loc.accountId,
        username: loc.account.username,
        displayName: loc.account.displayName,
        profilePhoto: loc.account.profilePhoto,
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: loc.timestamp,
      })),
    };
  }

  async getNetworkTaggedLocations(
    accountId: string,
    scope: 'followers' | 'following' | 'friends' | 'close_friends',
  ) {
    const targetIds = await this.getNetworkAccountIds(accountId, scope);
    if (targetIds.length === 0) return { tags: [] };

    // Note: In this repo's Prisma schema, `Post` has a `location` field, but `Story` does not.
    // So we only resolve tagged locations from posts here.
    const posts = await prisma.post.findMany({
      where: {
        accountId: { in: targetIds },
        location: { not: null },
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      take: TAG_GEOCODE_LIMIT,
      select: {
        id: true,
        accountId: true,
        location: true,
        createdAt: true,
        account: { select: { username: true, displayName: true } },
      },
    });

    const combined = posts
      .map((p) => ({ ...p, source: 'post' as const }))
      .filter((x) => !!x.location && x.location.trim().length > 0)
      .slice(0, TAG_GEOCODE_LIMIT);

    const resolved = await Promise.all(
      combined.map(async (item) => {
        const coords = await this.geocodeLocationName(item.location as string);
        if (!coords) return null;
        return {
          id: item.id,
          source: item.source,
          accountId: item.accountId,
          username: item.account.username,
          displayName: item.account.displayName,
          location: item.location,
          latitude: coords.lat,
          longitude: coords.lng,
          createdAt: item.createdAt,
        };
      }),
    );

    return { tags: resolved.filter(Boolean) };
  }

  /**
   * Record a nearby messaging send. Text-only: 10 free/day. Photo/media: 1 free/day. Resets at midnight.
   */
  async recordNearbyMessaging(
    accountId: string,
    kind: 'text' | 'media',
  ): Promise<{ ok: true; textUsed: number; mediaUsed: number }> {
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        nearbyPostCountToday: true,
        nearbyTextMessageCountToday: true,
        nearbyPostResetAt: true,
      },
    });
    if (!acc) throw new AppError('Account not found', 404);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const needReset = !acc.nearbyPostResetAt || acc.nearbyPostResetAt < midnight;
    const mediaCount = needReset ? 0 : (acc.nearbyPostCountToday ?? 0);
    const textCount = needReset ? 0 : (acc.nearbyTextMessageCountToday ?? 0);

    if (kind === 'text') {
      if (textCount >= NEARBY_TEXT_MESSAGES_FREE_PER_DAY) {
        throw new AppError(
          `Daily nearby text limit reached (${NEARBY_TEXT_MESSAGES_FREE_PER_DAY} messages/day). Try again tomorrow.`,
          429,
        );
      }
      const nextText = needReset ? 1 : textCount + 1;
      await prisma.account.update({
        where: { id: accountId },
        data: {
          nearbyTextMessageCountToday: nextText,
          nearbyPostCountToday: needReset ? 0 : mediaCount,
          nearbyPostResetAt: needReset ? midnight : acc.nearbyPostResetAt,
        },
      });
      void nearbyAnalytics
        .recordEvent(accountId, 'nearby_message_sent', { kind: 'text', channel: 'nearby' })
        .catch(() => {});
      return { ok: true, textUsed: nextText, mediaUsed: needReset ? 0 : mediaCount };
    }

    if (mediaCount >= NEARBY_PHOTO_POSTS_FREE_PER_DAY) {
      throw new AppError(
        `Daily nearby photo post limit reached (${NEARBY_PHOTO_POSTS_FREE_PER_DAY}/day). Try again tomorrow.`,
        429,
      );
    }
    const nextMedia = needReset ? 1 : mediaCount + 1;
    await prisma.account.update({
      where: { id: accountId },
      data: {
        nearbyPostCountToday: nextMedia,
        nearbyTextMessageCountToday: needReset ? 0 : textCount,
        nearbyPostResetAt: needReset ? midnight : acc.nearbyPostResetAt,
      },
    });
    void nearbyAnalytics
      .recordEvent(accountId, 'nearby_message_sent', { kind: 'media', channel: 'nearby' })
      .catch(() => {});
    return { ok: true, textUsed: needReset ? 0 : textCount, mediaUsed: nextMedia };
  }

  /** @deprecated Use recordNearbyMessaging(accountId, 'media') */
  async recordNearbyPost(accountId: string): Promise<{ ok: true; freeUsed: number }> {
    const r = await this.recordNearbyMessaging(accountId, 'media');
    return { ok: true, freeUsed: r.mediaUsed };
  }

  /** Get nearby messaging usage (text + photo) for UI. */
  async getNearbyPostUsage(accountId: string) {
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        nearbyPostCountToday: true,
        nearbyTextMessageCountToday: true,
        nearbyPostResetAt: true,
      },
    });
    if (!acc) throw new AppError('Account not found', 404);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const needReset = !acc.nearbyPostResetAt || acc.nearbyPostResetAt < midnight;
    const mediaUsed = needReset ? 0 : (acc.nearbyPostCountToday ?? 0);
    const textUsed = needReset ? 0 : (acc.nearbyTextMessageCountToday ?? 0);

    const chargesThisMonth = await prisma.nearbyPostCharge.count({
      where: {
        accountId,
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    });

    const textRemaining = Math.max(0, NEARBY_TEXT_MESSAGES_FREE_PER_DAY - textUsed);
    const mediaRemaining = Math.max(0, NEARBY_PHOTO_POSTS_FREE_PER_DAY - mediaUsed);

    return {
      textUsedToday: textUsed,
      textFreeLimit: NEARBY_TEXT_MESSAGES_FREE_PER_DAY,
      textRemaining,
      mediaUsedToday: mediaUsed,
      mediaFreeLimit: NEARBY_PHOTO_POSTS_FREE_PER_DAY,
      mediaRemaining,
      /** Legacy aliases */
      postsUsedToday: mediaUsed,
      freeLimitToday: NEARBY_PHOTO_POSTS_FREE_PER_DAY,
      overLimitChargePerPost: 0.5,
      chargesThisMonth: chargesThisMonth * 0.5,
    };
  }

  /** Aggregated Nearby map & messaging metrics from AnalyticsEvent + usage (last `days` days). */
  async getNearbyAnalyticsSummary(accountId: string, days = 7) {
    const usage = await this.getNearbyPostUsage(accountId);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [sentCount, impressionCount] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          accountId,
          eventType: 'nearby_message_sent',
          timestamp: { gte: since },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          accountId,
          eventType: 'nearby_message_impression',
          timestamp: { gte: since },
        },
      }),
    ]);

    return {
      periodDays: days,
      usage,
      nearbyMessagesSent: sentCount,
      nearbyImpressions: impressionCount,
    };
  }
}
