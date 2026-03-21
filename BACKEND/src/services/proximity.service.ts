/**
 * Proximity alerts: CRUD; check on location update and send notification.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { emitNotification } from '../sockets';

const RADIUS_OPTIONS = [100, 500, 1000, 2000] as const;

function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class ProximityService {
  async list(accountId: string) {
    const list = await prisma.proximityAlert.findMany({
      where: { accountId },
      include: {
        targetAccount: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((a) => ({
      id: a.id,
      targetAccount: a.targetAccount,
      radiusMeters: a.radiusMeters,
      cooldownMinutes: a.cooldownMinutes,
      lastTriggeredAt: a.lastTriggeredAt,
      isActive: a.isActive,
      createdAt: a.createdAt,
    }));
  }

  async create(accountId: string, data: { targetAccountId: string; radiusMeters?: number; cooldownMinutes?: number }) {
    const targetId = data.targetAccountId;
    if (targetId === accountId) throw new AppError('Cannot add yourself', 400);
    const radius = data.radiusMeters != null && RADIUS_OPTIONS.includes(data.radiusMeters as (typeof RADIUS_OPTIONS)[number])
      ? data.radiusMeters
      : 500;
    const cooldown = Math.min(Math.max(Number(data.cooldownMinutes) || 30, 5), 1440); // 5 min to 24h

    const existing = await prisma.proximityAlert.findUnique({
      where: {
        accountId_targetAccountId: { accountId, targetAccountId: targetId },
      },
    });
    if (existing) throw new AppError('Alert already exists for this contact', 400);

    const target = await prisma.account.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError('User not found', 404);

    return prisma.proximityAlert.create({
      data: {
        accountId,
        targetAccountId: targetId,
        radiusMeters: radius,
        cooldownMinutes: cooldown,
      },
      include: {
        targetAccount: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
  }

  async update(accountId: string, alertId: string, data: { radiusMeters?: number; cooldownMinutes?: number; isActive?: boolean }) {
    const alert = await prisma.proximityAlert.findFirst({
      where: { id: alertId, accountId },
    });
    if (!alert) throw new AppError('Alert not found', 404);
    const radius = data.radiusMeters != null && RADIUS_OPTIONS.includes(data.radiusMeters as any) ? data.radiusMeters : undefined;
    const cooldown = data.cooldownMinutes != null ? Math.min(Math.max(Number(data.cooldownMinutes), 5), 1440) : undefined;
    return prisma.proximityAlert.update({
      where: { id: alertId },
      data: {
        ...(radius != null && { radiusMeters: radius }),
        ...(cooldown != null && { cooldownMinutes: cooldown }),
        ...(data.isActive != null && { isActive: data.isActive }),
      },
      include: {
        targetAccount: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
  }

  async delete(accountId: string, alertId: string) {
    const alert = await prisma.proximityAlert.findFirst({
      where: { id: alertId, accountId },
    });
    if (!alert) throw new AppError('Alert not found', 404);
    await prisma.proximityAlert.delete({ where: { id: alertId } });
    return { ok: true };
  }

  /** Call when an account's location is updated: check if they are the target of any alert and trigger if in range. */
  async checkAndTrigger(targetAccountId: string, targetLat: number, targetLng: number) {
    const alerts = await prisma.proximityAlert.findMany({
      where: { targetAccountId, isActive: true },
      include: { account: { select: { id: true } } },
    });
    if (alerts.length === 0) return;

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ownerLocations = await prisma.locationHistory.findMany({
      where: {
        accountId: { in: alerts.map((a) => a.accountId) },
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'desc' },
    });
    const latestByOwner = new Map<string, { lat: number; lng: number }>();
    for (const loc of ownerLocations) {
      if (!latestByOwner.has(loc.accountId)) {
        latestByOwner.set(loc.accountId, { lat: loc.latitude, lng: loc.longitude });
      }
    }

    for (const alert of alerts) {
      const ownerLoc = latestByOwner.get(alert.accountId);
      if (!ownerLoc) continue;
      const dist = distanceM(ownerLoc.lat, ownerLoc.lng, targetLat, targetLng);
      if (dist > alert.radiusMeters) continue;
      const cooldownMs = alert.cooldownMinutes * 60 * 1000;
      if (alert.lastTriggeredAt && Date.now() - alert.lastTriggeredAt.getTime() < cooldownMs) continue;

      await prisma.proximityAlert.update({
        where: { id: alert.id },
        data: { lastTriggeredAt: new Date() },
      });
      const notification = await prisma.notification.create({
        data: {
          recipientId: alert.accountId,
          senderId: targetAccountId,
          type: 'PROXIMITY',
          content: `Someone you're tracking is within ${alert.radiusMeters}m (${Math.round(dist)}m away).`,
          data: { link: '/map/proximity-alerts' },
        },
        include: { sender: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
      });
      emitNotification(alert.accountId, {
        id: notification.id,
        type: notification.type,
        content: notification.content,
        createdAt: notification.createdAt?.toISOString?.() ?? new Date().toISOString(),
        read: notification.read,
        sender: notification.sender,
      });
    }
  }
}
