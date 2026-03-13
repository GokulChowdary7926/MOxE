/**
 * Safety: SOS alert — notify emergency contacts with optional location.
 */
import { prisma } from '../server';
import { NotificationService } from './notification.service';

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
    const name = account?.displayName || account?.username || 'Someone';
    const locationText =
      payload.latitude != null && payload.longitude != null
        ? ` Location: ${payload.latitude.toFixed(5)}, ${payload.longitude.toFixed(5)}`
        : '';
    const content = `${name} triggered an emergency SOS.${locationText}`;
    const data: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      type: 'SOS_ALERT',
    };
    if (payload.latitude != null) data.latitude = payload.latitude;
    if (payload.longitude != null) data.longitude = payload.longitude;

    for (const ec of contacts) {
      await notificationService
        .create(ec.contactId, 'SOS_ALERT', accountId, content, data)
        .catch(() => {});
    }

    return {
      ok: true,
      notifiedCount: contacts.length,
      contacts: contacts.map((c) => ({ id: c.contact.id, displayName: c.contact.displayName })),
    };
  }
}
