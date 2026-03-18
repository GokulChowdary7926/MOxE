type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (levelOrder[level] < levelOrder[currentLevel]) return;
  const ts = new Date().toISOString();
  const base = `${ts} [${level.toUpperCase()}] ${message}`;
  const extra = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  // eslint-disable-next-line no-console
  console.log(base + extra);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};

// Minimal Sentry-like shim so existing imports continue to work.
export const Sentry = {
  init: (_config: unknown) => {
    // no-op
  },
  captureException: (err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('[Sentry MOCK] captureException', err);
  },
};

