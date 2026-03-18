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
    logger.warn(err.message, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error('Unhandled error', { error: err });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  return res.status(500).json({ error: 'Internal server error' });
}
