export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  try {
    // Dynamic import so Sentry never breaks the app if missing or misconfigured
    import('@sentry/react').then((Sentry) => {
      const integration =
        typeof Sentry.browserTracingIntegration === 'function'
          ? Sentry.browserTracingIntegration()
          : undefined;
      Sentry.init({
        dsn,
        environment:
          import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
        integrations: integration ? [integration] : [],
        tracesSampleRate: 0.1,
      });
    }).catch(() => {
      // Sentry not available or init failed; app continues without monitoring
    });
  } catch {
    // no-op
  }
}

