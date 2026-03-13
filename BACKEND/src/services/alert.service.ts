import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { NotificationService } from './notification.service';
import { sendSms, isTwilioConfigured } from './twilio.service';

const notificationService = new NotificationService();

export class AlertService {
  async listSchedules(accountId: string) {
    return prisma.alertSchedule.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
      include: {
        participants: {
          include: {
            account: { select: { id: true, displayName: true, username: true, contactPhone: true } },
          },
        },
      },
    });
  }

  async createSchedule(
    accountId: string,
    data: {
      name: string;
      timezone: string;
      rotationType: 'WEEKLY' | 'DAILY' | 'CUSTOM';
      handoffDay?: number | null;
      handoffTime: string;
      participantAccountIds: string[];
    }
  ) {
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 100) throw new AppError('Schedule name must be 3–100 characters', 400);
    const tz = (data.timezone || '').trim();
    if (!tz) throw new AppError('Timezone is required', 400);
    const handoffTime = (data.handoffTime || '').trim();
    if (!handoffTime || !/^\d{2}:\d{2}$/.test(handoffTime)) throw new AppError('Invalid handoff time', 400);
    const participantIds = Array.isArray(data.participantAccountIds)
      ? data.participantAccountIds.filter(Boolean)
      : [];
    if (participantIds.length === 0) throw new AppError('At least one participant is required', 400);

    const schedule = await prisma.alertSchedule.create({
      data: {
        accountId,
        name,
        timezone: tz,
        rotationType: data.rotationType || 'WEEKLY',
        handoffDay: data.handoffDay ?? null,
        handoffTime,
        participants: {
          create: participantIds.map((pid, index) => ({
            accountId: pid,
            position: index,
            isSecondary: false,
          })),
        },
      },
      include: {
        participants: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      },
    });
    return schedule;
  }

  async createRule(
    accountId: string,
    data: {
      scheduleId: string;
      name: string;
      condition: unknown;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      escalationConfig?: unknown;
      notificationMethods?: unknown;
      quietHoursConfig?: unknown;
    }
  ) {
    const schedule = await prisma.alertSchedule.findFirst({
      where: { id: data.scheduleId, accountId },
    });
    if (!schedule) throw new AppError('Schedule not found', 404);
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 200) throw new AppError('Rule name must be 3–200 characters', 400);
    const rule = await prisma.alertRule.create({
      data: {
        scheduleId: schedule.id,
        name,
        condition: (data.condition || {}) as any,
        severity: data.severity || 'CRITICAL',
        escalationConfig: data.escalationConfig ? (data.escalationConfig as any) : null,
        notificationMethods: data.notificationMethods ? (data.notificationMethods as any) : null,
        quietHoursConfig: data.quietHoursConfig ? (data.quietHoursConfig as any) : null,
      },
    });
    return rule;
  }

  private getCurrentOnCallIndex(schedule: { rotationType: string; handoffDay: number | null; createdAt: Date }, participantCount: number) {
    if (participantCount === 0) return 0;
    const now = new Date();
    const millisPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((now.getTime() - schedule.createdAt.getTime()) / millisPerDay);
    if (schedule.rotationType === 'DAILY') {
      return ((diffDays % participantCount) + participantCount) % participantCount;
    }
    if (schedule.rotationType === 'WEEKLY') {
      const diffWeeks = Math.floor(diffDays / 7);
      return ((diffWeeks % participantCount) + participantCount) % participantCount;
    }
    // CUSTOM – treat as daily rotation by default
    return ((diffDays % participantCount) + participantCount) % participantCount;
  }

  async triggerRule(ruleId: string, payload?: unknown) {
    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
      include: {
        schedule: {
          include: {
            participants: {
              orderBy: { position: 'asc' },
              include: {
                account: {
                  select: { id: true, displayName: true, username: true, contactPhone: true },
                },
              },
            },
          },
        },
      },
    });
    if (!rule) throw new AppError('Rule not found', 404);
    if (!rule.isActive) throw new AppError('Rule is not active', 400);
    const participants = rule.schedule.participants;
    if (!participants || participants.length === 0) throw new AppError('No participants on schedule', 400);

    const idx = this.getCurrentOnCallIndex(
      { rotationType: rule.schedule.rotationType, handoffDay: rule.schedule.handoffDay, createdAt: rule.schedule.createdAt },
      participants.length
    );
    const primary = participants[idx];

    const event = await prisma.alertEvent.create({
      data: {
        ruleId: rule.id,
        payload: (payload || {}) as any,
      },
    });

    await prisma.alertDelivery.create({
      data: {
        eventId: event.id,
        recipientId: primary.accountId,
        channel: 'IN_APP',
        status: 'SENT',
      },
    });

    await notificationService.create(
      primary.accountId,
      'ALERT',
      undefined,
      {
        alertRuleId: rule.id,
        alertScheduleId: rule.scheduleId,
        severity: rule.severity,
        name: rule.name,
        eventId: event.id,
      } as any
    );

    const methods = (rule.notificationMethods as unknown as { sms?: boolean }) || {};
    const wantsSms = methods.sms === true || (rule.severity === 'CRITICAL' && methods.sms !== false);
    if (wantsSms && isTwilioConfigured() && primary.account?.contactPhone) {
      const body = `ALERT (${rule.severity}): ${rule.name}`;
      const smsResult = await sendSms(primary.account.contactPhone, body);
      await prisma.alertDelivery.create({
        data: {
          eventId: event.id,
          recipientId: primary.accountId,
          channel: 'SMS',
          status: smsResult.ok ? 'SENT' : 'FAILED',
        },
      });
    }

    return {
      eventId: event.id,
      recipientId: primary.accountId,
    };
  }
}

