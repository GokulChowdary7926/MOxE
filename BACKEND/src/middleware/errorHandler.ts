import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger, Sentry } from '../utils/logger';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn(err.message, { statusCode: err.statusCode, code: err.code });
    const body: { error: string; code?: string } = { error: err.message };
    if (err.code) body.code = err.code;
    return res.status(err.statusCode).json(body);
  }
  logger.error('Unhandled error', { error: err });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  const isDev = process.env.NODE_ENV !== 'production';
  const body: Record<string, string | undefined> = { error: 'Internal server error' };
  if (isDev && err instanceof Error && err.message) {
    // Helps local debugging (Safari Network tab / Redux). Never expose this detail in production.
    body.message = err.message;
    if (err.stack) {
      body.stack = err.stack
        .split('\n')
        .slice(0, 12)
        .join('\n');
    }
  }
  return res.status(500).json(body);
}
