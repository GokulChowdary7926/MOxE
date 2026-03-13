import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type EmergencyContactItem = {
  id: string;
  contactId: string;
  relationship: string;
  isPrimary: boolean;
  contact: { id: string; username: string; displayName: string; profilePhoto: string | null };
};

export class EmergencyContactService {
  async list(accountId: string): Promise<EmergencyContactItem[]> {
    const list = await prisma.emergencyContact.findMany({
      where: { accountId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      include: {
        contact: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return list.map((r) => ({
      id: r.id,
      contactId: r.contactId,
      relationship: r.relationship,
      isPrimary: r.isPrimary,
      contact: r.contact,
    }));
  }

  async add(accountId: string, contactId: string, relationship: string, isPrimary = false): Promise<EmergencyContactItem> {
    if (accountId === contactId) throw new AppError('Cannot add yourself as emergency contact', 400);
    const contact = await prisma.account.findUnique({ where: { id: contactId } });
    if (!contact) throw new AppError('Contact not found', 404);
    if (isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: { accountId },
        data: { isPrimary: false },
      });
    }
    const created = await prisma.emergencyContact.create({
      data: {
        accountId,
        contactId,
        relationship: relationship?.trim()?.slice(0, 100) || 'Contact',
        isPrimary,
        notificationMethods: ['PUSH'],
      },
      include: {
        contact: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return {
      id: created.id,
      contactId: created.contactId,
      relationship: created.relationship,
      isPrimary: created.isPrimary,
      contact: created.contact,
    };
  }

  async remove(accountId: string, id: string): Promise<void> {
    const rec = await prisma.emergencyContact.findFirst({ where: { id, accountId } });
    if (!rec) throw new AppError('Emergency contact not found', 404);
    await prisma.emergencyContact.delete({ where: { id } });
  }

  async setPrimary(accountId: string, id: string): Promise<EmergencyContactItem> {
    const rec = await prisma.emergencyContact.findFirst({ where: { id, accountId } });
    if (!rec) throw new AppError('Emergency contact not found', 404);
    await prisma.emergencyContact.updateMany({
      where: { accountId },
      data: { isPrimary: false },
    });
    const updated = await prisma.emergencyContact.update({
      where: { id },
      data: { isPrimary: true },
      include: {
        contact: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return {
      id: updated.id,
      contactId: updated.contactId,
      relationship: updated.relationship,
      isPrimary: updated.isPrimary,
      contact: updated.contact,
    };
  }
}
