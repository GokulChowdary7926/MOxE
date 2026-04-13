/**
 * Safety: SOS alert — notify emergency contacts with optional location.
 */
import { prisma } from '../server';
import { NotificationService } from './notification.service';
import { AppError } from '../utils/AppError';

const notificationService = new NotificationService();

export class SafetyService {
  /** Trigger SOS: notify all emergency contacts; optionally include location. */
  async triggerSOS(accountId: string, payload: { latitude?: number; longitude?: number }) {
    const contacts = await prisma.emergencyContact.findMany({
      where: { accountId },
      include: { contact: { select: { id: true, displayName: true } } },
    });
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { displayName: true, username: true },
    });
    if (contacts.length === 0) {
      throw new AppError('No emergency contacts found. Add at least one contact first.', 400);
    }
    const name = account?.displayName || account?.username || 'Someone';
    const mapsUrl =
      payload.latitude != null && payload.longitude != null
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${payload.latitude},${payload.longitude}`)}`
        : null;

    const locationText =
      payload.latitude != null && payload.longitude != null
        ? ` Location: ${payload.latitude.toFixed(5)}, ${payload.longitude.toFixed(5)}.`
        : '';

    const content = mapsUrl
      ? `${name} triggered an emergency SOS.${locationText} Google Maps: ${mapsUrl}`
      : `${name} triggered an emergency SOS.`;
    const data: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      type: 'SOS_ALERT',
    };
    if (payload.latitude != null) data.latitude = payload.latitude;
    if (payload.longitude != null) data.longitude = payload.longitude;
    if (mapsUrl) data.mapsUrl = mapsUrl;

    let notifiedCount = 0;
    for (const ec of contacts) {
      const n = await notificationService.create(ec.contactId, 'SOS_ALERT', accountId, content, data).catch(() => null);
      if (n) notifiedCount++;
    }

    return {
      ok: true,
      notifiedCount,
      contacts: contacts.map((c) => ({ id: c.contact.id, displayName: c.contact.displayName })),
    };
  }

  async getHangoutStatus(accountId: string, sessionId: string): Promise<{
    sessionId: string;
    status: string;
    lastCheckIn: string | null;
    nextCheckInDueAt: string | null;
    isOverdue: boolean;
  }> {
    const session = await prisma.hangoutSession.findFirst({
      where: { id: sessionId, accountId },
      select: { id: true, status: true, lastCheckIn: true, checkInInterval: true },
    });
    if (!session) throw new AppError('Hangout session not found', 404);
    const base = session.lastCheckIn ?? null;
    const dueAt = base ? new Date(base.getTime() + session.checkInInterval * 60 * 1000) : null;
    const isOverdue = !!dueAt && session.status === 'ACTIVE' && dueAt.getTime() < Date.now();
    return {
      sessionId: session.id,
      status: session.status,
      lastCheckIn: session.lastCheckIn?.toISOString() ?? null,
      nextCheckInDueAt: dueAt?.toISOString() ?? null,
      isOverdue,
    };
  }

  async escalateOverdueHangout(accountId: string, sessionId: string): Promise<{ ok: boolean; escalated: boolean }> {
    const status = await this.getHangoutStatus(accountId, sessionId);
    if (!status.isOverdue) return { ok: true, escalated: false };
    await prisma.hangoutSession.updateMany({
      where: { id: sessionId, accountId, status: 'ACTIVE' },
      data: { status: 'ALERTED' },
    });
    await this.triggerSOS(accountId, {});
    return { ok: true, escalated: true };
  }

  async escalateAllOverdueHangouts(accountId: string): Promise<{ ok: boolean; escalatedCount: number }> {
    const sessions = await prisma.hangoutSession.findMany({
      where: { accountId, status: 'ACTIVE' },
      select: { id: true, checkInInterval: true, lastCheckIn: true },
    });
    let escalatedCount = 0;
    for (const s of sessions) {
      if (!s.lastCheckIn) continue;
      const dueAt = new Date(s.lastCheckIn.getTime() + s.checkInInterval * 60 * 1000);
      if (dueAt.getTime() >= Date.now()) continue;
      await prisma.hangoutSession.updateMany({
        where: { id: s.id, accountId, status: 'ACTIVE' },
        data: { status: 'ALERTED' },
      });
      await this.triggerSOS(accountId, {});
      escalatedCount += 1;
    }
    return { ok: true, escalatedCount };
  }
}
