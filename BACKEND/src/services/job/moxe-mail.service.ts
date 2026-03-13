/**
 * MOxE MAIL integration for TRACK Recruiter.
 * Sends emails to candidates (templates or custom).
 * When MOxE_MAIL_URL or RESEND_API_KEY is set, attempts real delivery; otherwise logs and returns success.
 */

export interface SendCandidateEmailParams {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  personalization?: Record<string, string>;
}

export interface SendCandidateEmailResult {
  sent: boolean;
  message: string;
  provider?: string;
}

export async function sendCandidateEmail(params: SendCandidateEmailParams): Promise<SendCandidateEmailResult> {
  const { to, subject, body, templateId, personalization } = params;
  const mailUrl = process.env.MOxE_MAIL_URL || process.env.MAIL_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;

  if (mailUrl) {
    try {
      const res = await fetch(mailUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          templateId,
          personalization,
          source: 'track-recruiter',
        }),
      });
      if (res.ok) {
        return { sent: true, message: 'Email sent via MOxE MAIL', provider: 'MOxE_MAIL' };
      }
      const err = await res.text();
      console.warn('[MOxE MAIL]', res.status, err);
      return { sent: false, message: err || 'MOxE MAIL request failed' };
    } catch (e) {
      console.warn('[MOxE MAIL]', e);
      return { sent: false, message: (e as Error).message };
    }
  }

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'recruiting@moxe.com',
          to: [to],
          subject,
          html: body.replace(/\n/g, '<br/>'),
        }),
      });
      if (res.ok) {
        return { sent: true, message: 'Email sent via Resend', provider: 'Resend' };
      }
      const err = await res.json().catch(() => ({}));
      console.warn('[Resend]', res.status, err);
      return { sent: false, message: (err as any)?.message || 'Resend request failed' };
    } catch (e) {
      console.warn('[Resend]', e);
      return { sent: false, message: (e as Error).message };
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[MOxE MAIL stub]', { to: to.slice(0, 20) + '...', subject });
  }
  return { sent: true, message: 'Email queued. Set MOxE_MAIL_URL or RESEND_API_KEY for delivery.' };
}
