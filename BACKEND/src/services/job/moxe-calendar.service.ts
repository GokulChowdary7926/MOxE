/**
 * MOxE CALENDAR integration for TRACK Recruiter.
 * Creates interview events and sends calendar invites.
 * When MOxE_CALENDAR_URL is set, POSTs event; otherwise logs and returns success.
 */

export interface InterviewEventParams {
  interviewId: string;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  locationOrLink?: string;
  candidateEmail?: string;
  interviewerIds?: string[];
  reminderHoursBefore?: number[]; // e.g. [24, 1]
}

export interface CreateInterviewEventResult {
  created: boolean;
  message: string;
  provider?: string;
  eventId?: string;
}

export async function createInterviewEvent(params: InterviewEventParams): Promise<CreateInterviewEventResult> {
  const calendarUrl = process.env.MOxE_CALENDAR_URL || process.env.CALENDAR_WEBHOOK_URL;

  if (calendarUrl) {
    try {
      const res = await fetch(calendarUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'track-recruiter',
          interviewId: params.interviewId,
          title: params.title,
          start: params.scheduledAt.toISOString(),
          durationMinutes: params.durationMinutes,
          location: params.locationOrLink,
          attendeeEmails: params.candidateEmail ? [params.candidateEmail] : [],
          reminderHoursBefore: params.reminderHoursBefore ?? [24, 1],
          metadata: { interviewerIds: params.interviewerIds },
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          created: true,
          message: 'Calendar invite sent via MOxE CALENDAR',
          provider: 'MOxE_CALENDAR',
          eventId: (data as any)?.eventId,
        };
      }
      const err = await res.text();
      console.warn('[MOxE CALENDAR]', res.status, err);
      return { created: false, message: err || 'MOxE CALENDAR request failed' };
    } catch (e) {
      console.warn('[MOxE CALENDAR]', e);
      return { created: false, message: (e as Error).message };
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[MOxE CALENDAR stub]', {
      interviewId: params.interviewId,
      scheduledAt: params.scheduledAt,
      reminderHoursBefore: params.reminderHoursBefore,
    });
  }
  return {
    created: true,
    message: 'Invites queued. Set MOxE_CALENDAR_URL for actual calendar invites.',
  };
}

export interface FlowTaskEventParams {
  cardId: string;
  boardId: string;
  title: string;
  dueDate: Date;
  reminderHoursBefore?: number[];
}

export async function createFlowTaskEvent(params: FlowTaskEventParams): Promise<CreateInterviewEventResult> {
  const calendarUrl = process.env.MOxE_CALENDAR_URL || process.env.CALENDAR_WEBHOOK_URL;

  if (calendarUrl) {
    try {
      const res = await fetch(calendarUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'flow',
          cardId: params.cardId,
          boardId: params.boardId,
          title: params.title,
          start: params.dueDate.toISOString(),
          durationMinutes: 0,
          attendeeEmails: [],
          reminderHoursBefore: params.reminderHoursBefore ?? [24, 1],
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          created: true,
          message: 'Flow task event sent via MOxE CALENDAR',
          provider: 'MOxE_CALENDAR',
          eventId: (data as any)?.eventId,
        };
      }
      const err = await res.text();
      console.warn('[MOxE CALENDAR][flow]', res.status, err);
      return { created: false, message: err || 'MOxE CALENDAR request failed' };
    } catch (e) {
      console.warn('[MOxE CALENDAR][flow]', e);
      return { created: false, message: (e as Error).message };
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[MOxE CALENDAR stub][flow]', {
      cardId: params.cardId,
      boardId: params.boardId,
      dueDate: params.dueDate,
      reminderHoursBefore: params.reminderHoursBefore,
    });
  }
  return {
    created: true,
    message: 'Flow task queued. Set MOxE_CALENDAR_URL for actual calendar events.',
  };
}
