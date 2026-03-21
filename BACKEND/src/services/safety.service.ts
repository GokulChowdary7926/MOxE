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
}
