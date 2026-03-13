/**
 * Business verification: approve/reject requests.
 * Blue Badge gate (Guide 4.3): verifiedBadge is set only when subscriptionTier is STAR or THICK.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const PAID_TIERS = ['STAR', 'THICK'];

export async function reviewVerificationRequest(
  requestId: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<{ request: { id: string; status: string }; verifiedBadgeGranted: boolean }> {
  const req = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    include: { account: { select: { id: true, subscriptionTier: true } } },
  });
  if (!req) throw new AppError('Verification request not found', 404);
  if (req.status !== 'PENDING') throw new AppError('Request is not pending', 400);

  await prisma.verificationRequest.update({
    where: { id: requestId },
    data: { status, reviewedAt: new Date() },
  });

  let verifiedBadgeGranted = false;
  if (status === 'APPROVED' && req.account) {
    const tier = req.account.subscriptionTier as string;
    if (PAID_TIERS.includes(tier)) {
      await prisma.account.update({
        where: { id: req.account.id },
        data: { verifiedBadge: true, verifiedAt: new Date() },
      });
      verifiedBadgeGranted = true;
    }
    // If tier is FREE, request is approved but badge not granted (Blue Badge gate)
  }

  const updated = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });
  return { request: updated!, verifiedBadgeGranted };
}
