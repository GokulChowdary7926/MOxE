/**
 * MOxE CALENDAR — Track Recruiter interviews + Flow due reminders.
 *
 * Providers (first match wins):
 * 1. Webhook: `MOxE_CALENDAR_URL` or `CALENDAR_WEBHOOK_URL` — POST JSON (shape per `source`).
 * 2. Google Calendar: `MOXE_CALENDAR_GOOGLE=true` plus OAuth app + refresh token + `GOOGLE_CALENDAR_ID` (default `primary`).
 *
 * `MOXE_CALENDAR_ENABLED=false` disables all outbound calendar calls (`created: false`).
 * With no provider configured, returns `created: false` (no fake “queued” success).
 */

export interface InterviewEventParams {
  interviewId: string;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  locationOrLink?: string;
  candidateEmail?: string;
  interviewerIds?: string[];
  reminderHoursBefore?: number[];
}

export interface CreateInterviewEventResult {
  created: boolean;
  message: string;
  provider?: string;
  eventId?: string;
}

export interface FlowTaskEventParams {
  cardId: string;
  boardId: string;
  title: string;
  dueDate: Date;
  reminderHoursBefore?: number[];
}

function calendarDisabled(): boolean {
  const v = (process.env.MOXE_CALENDAR_ENABLED || '').toLowerCase().trim();
  return v === '0' || v === 'false' || v === 'off' || v === 'no';
}

function useGoogleCalendar(): boolean {
  return (process.env.MOXE_CALENDAR_GOOGLE || '').toLowerCase().trim() === 'true';
}

function reminderOverrides(hours?: number[]): { method: 'email' | 'popup'; minutes: number }[] {
  const list = hours?.length ? hours : [24, 1];
  const cap = 40320; // Google Calendar API max reminder minutes (~28 days)
  const minutesList = list.map((h) => Math.min(Math.max(0, Math.round(h * 60)), cap));
  const out: { method: 'email' | 'popup'; minutes: number }[] = [];
  for (const minutes of minutesList) {
    out.push({ method: 'email', minutes });
    out.push({ method: 'popup', minutes });
  }
  return out;
}

async function postWebhook(body: Record<string, unknown>): Promise<CreateInterviewEventResult | null> {
  const calendarUrl = process.env.MOxE_CALENDAR_URL || process.env.CALENDAR_WEBHOOK_URL;
  if (!calendarUrl) return null;
  try {
    const res = await fetch(calendarUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        created: true,
        message: 'Calendar event sent via MOxE CALENDAR webhook',
        provider: 'MOxE_CALENDAR',
        eventId: (data as { eventId?: string })?.eventId,
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

async function googleRefreshAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    console.warn('[MOxE CALENDAR][Google]', data.error, data.error_description);
    return null;
  }
  return data.access_token;
}

async function googleInsertEvent(
  accessToken: string,
  requestBody: Record<string, unknown>
): Promise<{ eventId?: string; error?: string }> {
  const calId = process.env.GOOGLE_CALENDAR_ID?.trim() || 'primary';
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?sendUpdates=all`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!res.ok) {
    return { error: data.error?.message || `Google Calendar HTTP ${res.status}` };
  }
  return { eventId: data.id };
}

async function tryGoogleInterview(params: InterviewEventParams): Promise<CreateInterviewEventResult | null> {
  if (!useGoogleCalendar()) return null;
  const accessToken = await googleRefreshAccessToken();
  if (!accessToken) {
    return {
      created: false,
      message:
        'Google Calendar enabled but OAuth is not configured (GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN).',
      provider: 'Google',
    };
  }
  const end = new Date(params.scheduledAt.getTime() + Math.max(1, params.durationMinutes) * 60 * 1000);
  const tz = process.env.MOXE_CALENDAR_TIMEZONE?.trim() || 'UTC';
  const attendees: { email: string }[] = [];
  if (params.candidateEmail) attendees.push({ email: params.candidateEmail });
  const body = {
    summary: params.title,
    description: `MOxE Track interview\ninterviewId: ${params.interviewId}\ninterviewerIds: ${(params.interviewerIds ?? []).join(',')}`,
    start: { dateTime: params.scheduledAt.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    location: params.locationOrLink || undefined,
    attendees: attendees.length ? attendees : undefined,
    reminders: { useDefault: false, overrides: reminderOverrides(params.reminderHoursBefore) },
  };
  const { eventId, error } = await googleInsertEvent(accessToken, body);
  if (error) {
    return { created: false, message: error, provider: 'Google' };
  }
  return { created: true, message: 'Interview event created in Google Calendar', provider: 'Google', eventId };
}

async function tryGoogleFlow(params: FlowTaskEventParams): Promise<CreateInterviewEventResult | null> {
  if (!useGoogleCalendar()) return null;
  const accessToken = await googleRefreshAccessToken();
  if (!accessToken) {
    return {
      created: false,
      message:
        'Google Calendar enabled but OAuth is not configured (GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN).',
      provider: 'Google',
    };
  }
  const start = params.dueDate;
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const tz = process.env.MOXE_CALENDAR_TIMEZONE?.trim() || 'UTC';
  const body = {
    summary: params.title,
    description: `MOxE Flow card due\nboardId: ${params.boardId}\ncardId: ${params.cardId}`,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    reminders: { useDefault: false, overrides: reminderOverrides(params.reminderHoursBefore) },
  };
  const { eventId, error } = await googleInsertEvent(accessToken, body);
  if (error) {
    return { created: false, message: error, provider: 'Google' };
  }
  return { created: true, message: 'Flow task event created in Google Calendar', provider: 'Google', eventId };
}

function noProviderResult(): CreateInterviewEventResult {
  const hint =
    'Set MOxE_CALENDAR_URL, or MOXE_CALENDAR_GOOGLE=true with Google OAuth credentials and GOOGLE_CALENDAR_ID.';
  if (process.env.NODE_ENV === 'development') {
    console.log('[MOxE CALENDAR] no provider configured');
  }
  return {
    created: false,
    message: `No calendar provider configured. ${hint}`,
    provider: 'none',
  };
}

export async function createInterviewEvent(params: InterviewEventParams): Promise<CreateInterviewEventResult> {
  if (calendarDisabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MOxE CALENDAR] disabled (MOXE_CALENDAR_ENABLED=false)', params.interviewId);
    }
    return {
      created: false,
      message: 'Calendar integration is disabled (MOXE_CALENDAR_ENABLED=false).',
      provider: 'disabled',
    };
  }

  const webhook = await postWebhook({
    source: 'track-recruiter',
    interviewId: params.interviewId,
    title: params.title,
    start: params.scheduledAt.toISOString(),
    durationMinutes: params.durationMinutes,
    location: params.locationOrLink,
    attendeeEmails: params.candidateEmail ? [params.candidateEmail] : [],
    reminderHoursBefore: params.reminderHoursBefore ?? [24, 1],
    metadata: { interviewerIds: params.interviewerIds },
  });
  if (webhook) return webhook;

  const google = await tryGoogleInterview(params);
  if (google) return google;

  return noProviderResult();
}

export async function createFlowTaskEvent(params: FlowTaskEventParams): Promise<CreateInterviewEventResult> {
  if (calendarDisabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MOxE CALENDAR] disabled (MOXE_CALENDAR_ENABLED=false)', params.cardId);
    }
    return {
      created: false,
      message: 'Calendar integration is disabled (MOXE_CALENDAR_ENABLED=false).',
      provider: 'disabled',
    };
  }

  const webhook = await postWebhook({
    source: 'flow',
    cardId: params.cardId,
    boardId: params.boardId,
    title: params.title,
    start: params.dueDate.toISOString(),
    durationMinutes: 0,
    attendeeEmails: [],
    reminderHoursBefore: params.reminderHoursBefore ?? [24, 1],
  });
  if (webhook) return webhook;

  const google = await tryGoogleFlow(params);
  if (google) return google;

  return noProviderResult();
}
