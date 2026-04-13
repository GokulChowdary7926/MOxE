/**
 * MOxE MAIL — Track Recruiter candidate email.
 *
 * Providers (first match wins):
 * 1. POST webhook: `MOxE_MAIL_URL` or `MAIL_WEBHOOK_URL`
 * 2. Resend: `RESEND_API_KEY` (+ optional `RESEND_FROM`)
 * 3. SendGrid: `SENDGRID_API_KEY` (+ optional `SENDGRID_FROM` / `MOXE_MAIL_FROM`)
 * 4. AWS SES: `MOXE_MAIL_USE_SES=true` + `MOXE_MAIL_SES_FROM` + `AWS_REGION` (uses default AWS credential chain)
 *
 * `MOXE_MAIL_ENABLED=false` disables all outbound delivery (returns sent: false).
 * With no provider configured, returns sent: false and a clear message (no fake “queued” success).
 */

import AWS from 'aws-sdk';
import sgMail from '@sendgrid/mail';

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

function mailDisabled(): boolean {
  const v = (process.env.MOXE_MAIL_ENABLED || '').toLowerCase().trim();
  return v === '0' || v === 'false' || v === 'off' || v === 'no';
}

function htmlBody(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(/\n/g, '<br/>');
}

export async function sendCandidateEmail(params: SendCandidateEmailParams): Promise<SendCandidateEmailResult> {
  const { to, subject, body, templateId, personalization } = params;

  if (mailDisabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MOxE MAIL] disabled (MOXE_MAIL_ENABLED=false)', { to: to.slice(0, 24), subject });
    }
    return {
      sent: false,
      message: 'Outbound mail is disabled (MOXE_MAIL_ENABLED=false).',
      provider: 'disabled',
    };
  }

  const mailUrl = process.env.MOxE_MAIL_URL || process.env.MAIL_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const useSes = (process.env.MOXE_MAIL_USE_SES || '').toLowerCase() === 'true';
  const sesFrom = process.env.MOXE_MAIL_SES_FROM?.trim();
  const awsRegion = process.env.AWS_REGION?.trim();
  const defaultFrom = process.env.MOXE_MAIL_FROM || process.env.SENDGRID_FROM || process.env.RESEND_FROM;

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
        return { sent: true, message: 'Email sent via MOxE MAIL webhook', provider: 'MOxE_MAIL' };
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
          from: process.env.RESEND_FROM || defaultFrom || 'recruiting@moxe.com',
          to: [to],
          subject,
          html: htmlBody(body),
        }),
      });
      if (res.ok) {
        return { sent: true, message: 'Email sent via Resend', provider: 'Resend' };
      }
      const err = await res.json().catch(() => ({}));
      console.warn('[Resend]', res.status, err);
      return { sent: false, message: (err as { message?: string })?.message || 'Resend request failed' };
    } catch (e) {
      console.warn('[Resend]', e);
      return { sent: false, message: (e as Error).message };
    }
  }

  if (sendgridKey) {
    try {
      sgMail.setApiKey(sendgridKey);
      const from = defaultFrom || 'recruiting@moxe.com';
      await sgMail.send({
        to,
        from,
        subject,
        html: htmlBody(body),
      });
      return { sent: true, message: 'Email sent via SendGrid', provider: 'SendGrid' };
    } catch (e: unknown) {
      let msg = 'SendGrid request failed';
      if (e && typeof e === 'object' && 'response' in e) {
        msg = JSON.stringify((e as { response?: { body?: unknown } }).response?.body) || msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      console.warn('[SendGrid]', e);
      return { sent: false, message: msg };
    }
  }

  if (useSes && sesFrom && awsRegion) {
    try {
      const ses = new AWS.SES({ region: awsRegion });
      await ses
        .sendEmail({
          Source: sesFrom,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: htmlBody(body), Charset: 'UTF-8' },
            },
          },
        })
        .promise();
      return { sent: true, message: 'Email sent via Amazon SES', provider: 'SES' };
    } catch (e) {
      console.warn('[SES]', e);
      return { sent: false, message: (e as Error).message };
    }
  }

  const hint =
    'Set MOxE_MAIL_URL, RESEND_API_KEY, SENDGRID_API_KEY, or MOXE_MAIL_USE_SES=true with MOXE_MAIL_SES_FROM and AWS_REGION.';
  if (process.env.NODE_ENV === 'development') {
    console.log('[MOxE MAIL] no provider configured', { to: to.slice(0, 24) + (to.length > 24 ? '…' : ''), subject });
  }
  return {
    sent: false,
    message: `No mail provider configured. ${hint}`,
    provider: 'none',
  };
}
