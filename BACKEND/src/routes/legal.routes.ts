import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { SupportService } from '../services/support.service';
import {
  createMemorializationRequest,
  createProfileClaimRequest,
  listMyMemorializationRequests,
  listMyProfileClaims,
  logLegalSubmission,
} from '../services/legal.service';
import { AppError } from '../utils/AppError';

const router = Router();
const supportService = new SupportService();

function str(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

router.post('/memorialization-requests', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const subjectUsername = str(req.body?.subjectUsername, 100);
    const relationship = str(req.body?.relationship, 200);
    const details = str(req.body?.details, 8000);
    if (!subjectUsername || !relationship || !details) throw new AppError('subjectUsername, relationship, details required', 400);
    const row = await createMemorializationRequest(accountId, { subjectUsername, relationship, details });
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

router.get('/memorialization-requests/me', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const list = await listMyMemorializationRequests(accountId);
    res.json({ requests: list });
  } catch (e) {
    next(e);
  }
});

router.post('/profile-claims', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const targetUsername = str(req.body?.targetUsername, 100);
    const justification = str(req.body?.justification, 8000);
    if (!targetUsername || !justification) throw new AppError('targetUsername and justification required', 400);
    const row = await createProfileClaimRequest(accountId, { targetUsername, justification });
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

router.get('/profile-claims/me', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const list = await listMyProfileClaims(accountId);
    res.json({ claims: list });
  } catch (e) {
    next(e);
  }
});

/** DMCA-style counter-notification: logged + support ticket for legal review. */
router.post('/counter-notifications', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const fullLegalName = str(req.body?.fullLegalName, 200);
    const address = str(req.body?.address, 500);
    const phoneOrEmail = str(req.body?.phoneOrEmail, 200);
    const originalComplaintRef = str(req.body?.originalComplaintRef, 500);
    const goodFaithStatement = str(req.body?.goodFaithStatement, 4000);
    const consentJurisdiction = str(req.body?.consentJurisdiction, 2000);
    if (!fullLegalName || !address || !phoneOrEmail || !originalComplaintRef || !goodFaithStatement || !consentJurisdiction) {
      throw new AppError('All counter-notification fields are required', 400);
    }
    const payload = {
      fullLegalName,
      address,
      phoneOrEmail,
      originalComplaintRef,
      goodFaithStatement,
      consentJurisdiction,
    };
    await logLegalSubmission(accountId, 'COUNTER_NOTIFICATION', payload);
    const msg = ['COUNTER-NOTIFICATION (automated intake)', JSON.stringify(payload, null, 2)].join('\n\n');
    const ticket = await supportService.createTicket(accountId, {
      subject: 'DMCA counter-notification',
      message: msg,
      category: 'legal_counter_notice',
    });
    res.status(201).json({ ok: true, ticketId: ticket.id });
  } catch (e) {
    next(e);
  }
});

/** Law enforcement / preservation — logged + ticket. */
router.post('/law-enforcement-submissions', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const agency = str(req.body?.agency, 200);
    const badgeOrCaseId = str(req.body?.badgeOrCaseId, 200);
    const contactEmail = str(req.body?.contactEmail, 200);
    const summary = str(req.body?.summary, 8000);
    const preservationRequest = !!req.body?.preservationRequest;
    if (!agency || !contactEmail || !summary) throw new AppError('agency, contactEmail, summary required', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new AppError('valid contactEmail required', 400);
    const payload = { agency, badgeOrCaseId: badgeOrCaseId || undefined, contactEmail, summary, preservationRequest };
    await logLegalSubmission(accountId, 'LE_INQUIRY', payload);
    const ticket = await supportService.createTicket(accountId, {
      subject: `Law enforcement inquiry — ${agency}`,
      message: JSON.stringify(payload, null, 2),
      category: 'legal_le_inquiry',
    });
    res.status(201).json({ ok: true, ticketId: ticket.id });
  } catch (e) {
    next(e);
  }
});

/** Subpoena / formal legal process intake (logged + ticket). */
router.post('/subpoena-submissions', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const issuingAuthority = str(req.body?.issuingAuthority, 300);
    const matterReference = str(req.body?.matterReference, 300);
    const serviceAddress = str(req.body?.serviceAddress, 500);
    const scope = str(req.body?.scope, 8000);
    if (!issuingAuthority || !serviceAddress || !scope) throw new AppError('issuingAuthority, serviceAddress, scope required', 400);
    const payload = { issuingAuthority, matterReference: matterReference || undefined, serviceAddress, scope };
    await logLegalSubmission(accountId, 'SUBPOENA_NOTICE', payload);
    const ticket = await supportService.createTicket(accountId, {
      subject: `Subpoena / legal process — ${issuingAuthority}`,
      message: JSON.stringify(payload, null, 2),
      category: 'legal_le_inquiry',
    });
    res.status(201).json({ ok: true, ticketId: ticket.id });
  } catch (e) {
    next(e);
  }
});

/** Data portability — assisted transfer request (intake only). */
router.post('/transfer-requests', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId as string | undefined;
    if (!accountId) throw new AppError('Unauthorized', 401);
    const destinationService = str(req.body?.destinationService, 200);
    const notes = str(req.body?.notes, 8000);
    if (!destinationService) throw new AppError('destinationService required', 400);
    const payload = { destinationService, notes: notes || undefined };
    await logLegalSubmission(accountId, 'TRANSFER_REQUEST', payload);
    const ticket = await supportService.createTicket(accountId, {
      subject: `Data transfer request — ${destinationService}`,
      message: JSON.stringify(payload, null, 2),
      category: 'data_transfer',
    });
    res.status(201).json({ ok: true, ticketId: ticket.id });
  } catch (e) {
    next(e);
  }
});

export default router;
