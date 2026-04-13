import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { prisma } from '../server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthPayload {
  userId: string;
  accountId?: string;
}

export async function authenticate(req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    let accountId = decoded.accountId;
    if (accountId) {
      const exists = await prisma.account.findUnique({
        where: { id: accountId },
        select: { id: true },
      });
      if (!exists) {
        throw new AppError('Unauthorized', 401);
      }
    }
    if (!accountId && decoded.userId) {
      const account = await prisma.account.findFirst({
        where: { userId: decoded.userId, isActive: true },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!account) {
        throw new AppError('Unauthorized', 401);
      }
      accountId = account.id;
    }
    req.user = { ...decoded, accountId };
    // Update lastActiveAt for activity status (fire-and-forget)
    if (accountId) {
      prisma.account.update({ where: { id: accountId }, data: { lastActiveAt: new Date() } }).catch(() => {});
    }
    next();
  } catch {
    next(new AppError('Unauthorized', 401));
  }
}

/** Same as authenticate but does not 401 when token is missing or invalid; req.user may be unset. */
export async function optionalAuthenticate(req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    let accountId = decoded.accountId;
    if (accountId) {
      const exists = await prisma.account.findUnique({
        where: { id: accountId },
        select: { id: true },
      });
      if (!exists) return next();
    }
    if (!accountId && decoded.userId) {
      const account = await prisma.account.findFirst({
        where: { userId: decoded.userId, isActive: true },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!account) return next();
      accountId = account.id;
    }
    req.user = { ...decoded, accountId };
    next();
  } catch {
    next();
  }
}
