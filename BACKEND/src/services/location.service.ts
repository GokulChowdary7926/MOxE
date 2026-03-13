/**
 * Location: record location for nearby discovery; list nearby accounts.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { ProximityService } from './proximity.service';

const MAX_RADIUS_M = 50_000;
const DEFAULT_RADIUS_M = 5000;
const LOCATION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

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
   * Lightweight location search for the composer:
   * - For now we reuse distinct post.location values as "places".
   * - Later this can be swapped to an external provider (Google, Mapbox, etc.).
   */
  async searchPlaces(query: string, limit = 10) {
    const term = query.trim();
    if (!term) return [];

    const rows = await prisma.post.findMany({
      where: {
        location: {
          contains: term,
          mode: 'insensitive',
        },
      },
      distinct: ['location'],
      take: Math.min(limit, 20),
      select: { location: true },
    });

    return rows
      .filter((r) => !!r.location)
      .map((r, idx) => ({
        id: String(idx), // simple client id; can be replaced with real placeId later
        name: r.location as string,
      }));
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

  /** 4.1.1 Nearby messaging post: 1 free/day for paid (STAR/THICK), then $0.50 per extra. Records charge when over limit. */
  async recordNearbyPost(accountId: string): Promise<{ ok: true; freeUsed: number; overLimitCharge?: number }> {
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true, nearbyPostCountToday: true, nearbyPostResetAt: true },
    });
    if (!acc) throw new AppError('Account not found', 404);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const needReset = !acc.nearbyPostResetAt || acc.nearbyPostResetAt < midnight;
    const count = needReset ? 0 : (acc.nearbyPostCountToday ?? 0);
    const freeLimit = acc.subscriptionTier === 'STAR' || acc.subscriptionTier === 'THICK' ? 1 : 0;
    const overLimit = count >= freeLimit;
    const chargeAmount = 0.5; // $0.50

    if (overLimit) {
      await prisma.nearbyPostCharge.create({
        data: { accountId, amountCents: 50 },
      });
    }

    await prisma.account.update({
      where: { id: accountId },
      data: {
        nearbyPostCountToday: needReset ? 1 : count + 1,
        nearbyPostResetAt: needReset ? midnight : acc.nearbyPostResetAt,
      },
    });

    return {
      ok: true,
      freeUsed: needReset ? 1 : count + 1,
      ...(overLimit && { overLimitCharge: chargeAmount }),
    };
  }

  /** Get nearby post usage and any pending charges (for display). */
  async getNearbyPostUsage(accountId: string) {
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true, nearbyPostCountToday: true, nearbyPostResetAt: true },
    });
    if (!acc) throw new AppError('Account not found', 404);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const needReset = !acc.nearbyPostResetAt || acc.nearbyPostResetAt < midnight;
    const count = needReset ? 0 : (acc.nearbyPostCountToday ?? 0);
    const freeLimit = acc.subscriptionTier === 'STAR' || acc.subscriptionTier === 'THICK' ? 1 : 0;
    const chargesThisMonth = await prisma.nearbyPostCharge.count({
      where: {
        accountId,
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    });
    return {
      postsUsedToday: count,
      freeLimitToday: freeLimit,
      overLimitChargePerPost: 0.5,
      chargesThisMonth: chargesThisMonth * 0.5,
    };
  }
}
