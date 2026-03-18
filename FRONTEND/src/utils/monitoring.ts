import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
  });
}

