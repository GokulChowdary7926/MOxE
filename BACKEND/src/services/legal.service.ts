import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export async function createMemorializationRequest(
  requesterAccountId: string,
  data: { subjectUsername: string; relationship: string; details: string },
) {
  const u = data.subjectUsername.trim().replace(/^@/, '');
  if (!u || u.length > 100) throw new AppError('subjectUsername required', 400);
  if (!data.relationship?.trim()) throw new AppError('relationship required', 400);
  if (!data.details?.trim()) throw new AppError('details required', 400);
  return prisma.memorializationRequest.create({
    data: {
      requesterAccountId,
      subjectUsername: u,
      relationship: data.relationship.trim().slice(0, 200),
      details: data.details.trim().slice(0, 8000),
    },
  });
}

export async function listMyMemorializationRequests(requesterAccountId: string) {
  return prisma.memorializationRequest.findMany({
    where: { requesterAccountId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProfileClaimRequest(
  requesterAccountId: string,
  data: { targetUsername: string; justification: string },
) {
  const u = data.targetUsername.trim().replace(/^@/, '');
  if (!u || u.length > 100) throw new AppError('targetUsername required', 400);
  if (!data.justification?.trim()) throw new AppError('justification required', 400);
  return prisma.profileClaimRequest.create({
    data: {
      requesterAccountId,
      targetUsername: u,
      justification: data.justification.trim().slice(0, 8000),
    },
  });
}

export async function listMyProfileClaims(requesterAccountId: string) {
  return prisma.profileClaimRequest.findMany({
    where: { requesterAccountId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function logLegalSubmission(
  accountId: string | null,
  type: string,
  payload: Record<string, unknown>,
) {
  return prisma.legalRequestLog.create({
    data: {
      accountId: accountId || undefined,
      type: type.slice(0, 40),
      payload: payload as object,
    },
  });
}

/** Admin: list pending memorial requests */
export async function adminListMemorializationRequests() {
  return prisma.memorializationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: { username: true, displayName: true } } },
  });
}

export async function adminReviewMemorializationRequest(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  staffNote?: string,
) {
  const row = await prisma.memorializationRequest.findUnique({ where: { id } });
  if (!row) throw new AppError('Request not found', 404);
  if (row.status !== 'PENDING') throw new AppError('Already reviewed', 400);

  if (status === 'APPROVED') {
    const target = await prisma.account.findUnique({
      where: { username: row.subjectUsername },
    });
    if (!target) throw new AppError('Subject account not found', 404);
    await prisma.$transaction([
      prisma.account.update({
        where: { id: target.id },
        data: { isMemorialized: true, memorializedAt: new Date() },
      }),
      prisma.memorializationRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          staffNote: staffNote?.slice(0, 2000) ?? null,
        },
      }),
    ]);
    return prisma.memorializationRequest.findUnique({ where: { id } });
  }

  return prisma.memorializationRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      staffNote: staffNote?.slice(0, 2000) ?? null,
    },
  });
}

export async function adminListProfileClaims() {
  return prisma.profileClaimRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: { username: true, displayName: true } } },
  });
}

export async function adminReviewProfileClaim(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  staffNote?: string,
) {
  const row = await prisma.profileClaimRequest.findUnique({ where: { id } });
  if (!row) throw new AppError('Request not found', 404);
  if (row.status !== 'PENDING') throw new AppError('Already reviewed', 400);
  return prisma.profileClaimRequest.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      staffNote: staffNote?.slice(0, 2000) ?? null,
    },
  });
}
