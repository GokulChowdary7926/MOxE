import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
    };
    if (res.statusCode >= 500) {
      logger.error(msg, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(msg, meta);
    } else {
      logger.info(msg, meta);
    }
  });

  next();
}

