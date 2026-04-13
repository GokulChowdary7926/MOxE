import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';
import { sendCandidateEmail } from './moxe-mail.service';
import { createInterviewEvent } from './moxe-calendar.service';

export class TrackRecruiterService {
  private async ensureJobAccess(accountId: string, jobPostingId: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { postedById: true, recruiterId: true, hiringManagerId: true },
    });
    if (!job) throw new AppError('Job not found', 404);
    const canAccess =
      job.postedById === accountId ||
      job.recruiterId === accountId ||
      job.hiringManagerId === accountId;
    if (!canAccess) throw new AppError('Not authorized for this job', 403);
  }

  /** List all candidates for a job (applications + recruiter-added), optionally by stage */
  async listCandidatesByJob(accountId: string, jobPostingId: string, stageId?: string) {
    await this.ensureJobAccess(accountId, jobPostingId);

    const [applications, recruitmentCandidates] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { jobPostingId, ...(stageId ? { pipelineStageId: stageId } : {}) },
        include: {
          account: { select: { id: true, displayName: true, username: true, profilePhoto: true } },
          pipelineStage: true,
        },
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.recruitmentCandidate.findMany({
        where: { jobPostingId, ...(stageId ? { pipelineStageId: stageId } : {}) },
        include: { pipelineStage: true, addedBy: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: { pipeline: { include: { stages: { orderBy: { order: 'asc' } } } } },
    });

    return {
      job,
      applications: applications.map((a) => ({ ...a, kind: 'application' as const })),
      recruitmentCandidates: recruitmentCandidates.map((c) => ({ ...c, kind: 'recruitment' as const })),
      stages: job?.pipeline?.stages ?? [],
    };
  }

  /** Get single candidate (application or recruitment) */
  async getCandidate(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string
  ) {
    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({
        where: { id: candidateId },
        include: {
          jobPosting: true,
          pipelineStage: true,
          account: true,
          decidedBy: { select: { id: true, displayName: true } },
          interviews: {
            include: {
              feedbacks: true,
              interviewers: { include: { account: { select: { id: true, displayName: true } } } },
            },
          },
        },
      });
      if (!app) throw new AppError('Application not found', 404);
      await this.ensureJobAccess(accountId, app.jobPostingId);
      return { ...app, kind: 'application' as const };
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({
        where: { id: candidateId },
        include: {
          jobPosting: true,
          pipelineStage: true,
          addedBy: { select: { id: true, displayName: true } },
          interviews: {
            include: {
              feedbacks: true,
              interviewers: { include: { account: { select: { id: true, displayName: true } } } },
            },
          },
        },
      });
      if (!cand) throw new AppError('Candidate not found', 404);
      await this.ensureJobAccess(accountId, cand.jobPostingId);
      return { ...cand, kind: 'recruitment' as const };
    }
  }

  /** Move candidate to a pipeline stage; optional status and reason/note (appended to notes) */
  async moveCandidate(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    data: { pipelineStageId: string; status?: string; reason?: string }
  ) {
    const noteLine = data.reason
      ? `\n[Stage move: ${new Date().toISOString().slice(0, 10)}] ${data.reason}`
      : '';
    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({ where: { id: candidateId }, select: { jobPostingId: true, notes: true } });
      if (!app) throw new AppError('Application not found', 404);
      await this.ensureJobAccess(accountId, app.jobPostingId);
      const update: { pipelineStageId: string; status?: string; notes?: string } = { pipelineStageId: data.pipelineStageId };
      if (data.status) update.status = data.status;
      if (noteLine) update.notes = (app.notes || '') + noteLine;
      return prisma.jobApplication.update({
        where: { id: candidateId },
        data: update,
        include: { pipelineStage: true, account: { select: { id: true, displayName: true, username: true } } },
      });
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({ where: { id: candidateId }, select: { jobPostingId: true, notes: true } });
      if (!cand) throw new AppError('Candidate not found', 404);
      await this.ensureJobAccess(accountId, cand.jobPostingId);
      const update: { pipelineStageId: string; status?: string; notes?: string } = { pipelineStageId: data.pipelineStageId };
      if (data.status) update.status = data.status;
      if (noteLine) update.notes = (cand.notes || '') + noteLine;
      return prisma.recruitmentCandidate.update({
        where: { id: candidateId },
        data: update,
        include: { pipelineStage: true },
      });
    }
  }

  /** Add or update notes */
  /** Add or append notes. If options.append and options.noteType, appends "[Type: noteType] date: content". */
  async addNotes(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    notes: string,
    options?: { append?: boolean; noteType?: string }
  ) {
    const validNoteTypes = ['GENERAL', 'INTERVIEW_FEEDBACK', 'FOLLOW_UP', 'RED_FLAG', 'GREEN_FLAG', 'ADMIN'];
    const noteType = options?.noteType && validNoteTypes.includes(options.noteType.toUpperCase())
      ? options.noteType.toUpperCase()
      : 'GENERAL';
    const dateStr = new Date().toISOString().slice(0, 10);
    const line = options?.append
      ? `\n[${noteType}] ${dateStr}: ${notes}`
      : notes;

    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({ where: { id: candidateId }, select: { jobPostingId: true, notes: true } });
      if (!app) throw new AppError('Application not found', 404);
      await this.ensureJobAccess(accountId, app.jobPostingId);
      const newNotes = options?.append ? (app.notes || '') + line : notes;
      return prisma.jobApplication.update({
        where: { id: candidateId },
        data: { notes: newNotes },
        include: { pipelineStage: true },
      });
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({ where: { id: candidateId }, select: { jobPostingId: true, notes: true } });
      if (!cand) throw new AppError('Candidate not found', 404);
      await this.ensureJobAccess(accountId, cand.jobPostingId);
      const newNotes = options?.append ? (cand.notes || '') + line : notes;
      return prisma.recruitmentCandidate.update({
        where: { id: candidateId },
        data: { notes: newNotes },
        include: { pipelineStage: true },
      });
    }
  }

  /** Rate candidate 1-5 */
  async rateCandidate(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    rating: number,
    ratingComment?: string
  ) {
    if (rating < 1 || rating > 5) throw new AppError('Rating must be 1-5', 400);
    const data: { rating: number; ratingComment?: string } = { rating };
    if (ratingComment != null) data.ratingComment = ratingComment;
    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!app) throw new AppError('Application not found', 404);
      await this.ensureJobAccess(accountId, app.jobPostingId);
      return prisma.jobApplication.update({
        where: { id: candidateId },
        data,
        include: { pipelineStage: true },
      });
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!cand) throw new AppError('Candidate not found', 404);
      await this.ensureJobAccess(accountId, cand.jobPostingId);
      return prisma.recruitmentCandidate.update({
        where: { id: candidateId },
        data,
        include: { pipelineStage: true },
      });
    }
  }

  /** Track source for application (or recruitment candidate) */
  async trackSource(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    source: string
  ) {
    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!app) throw new AppError('Application not found', 404);
      await this.ensureJobAccess(accountId, app.jobPostingId);
      return prisma.jobApplication.update({
        where: { id: candidateId },
        data: { source },
        include: { pipelineStage: true },
      });
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!cand) throw new AppError('Candidate not found', 404);
      await this.ensureJobAccess(accountId, cand.jobPostingId);
      return prisma.recruitmentCandidate.update({
        where: { id: candidateId },
        data: { source },
        include: { pipelineStage: true },
      });
    }
  }

  /** Add a candidate manually (recruiter-added). If merge=true and email exists, updates existing record. Spec: Resume required unless merge. */
  async addCandidate(accountId: string, jobPostingId: string, data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    currentCompany?: string;
    currentTitle?: string;
    resumeUrl?: string;
    linkedInUrl?: string;
    portfolioUrl?: string;
    coverLetter?: string;
    source?: string;
  }, options?: { merge?: boolean }) {
    await this.ensureJobAccess(accountId, jobPostingId);

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: { pipeline: { include: { stages: { orderBy: { order: 'asc' }, take: 1 } } } },
    });
    if (!job) throw new AppError('Job not found', 404);

    const firstStageId = job.pipeline?.stages?.[0]?.id ?? null;
    const emailNorm = data.email.trim().toLowerCase();

    const existing = await prisma.recruitmentCandidate.findUnique({
      where: { jobPostingId_email: { jobPostingId, email: emailNorm } },
    });
    if (existing) {
      if (options?.merge) {
        return prisma.recruitmentCandidate.update({
          where: { id: existing.id },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            currentCompany: data.currentCompany,
            currentTitle: data.currentTitle,
            resumeUrl: data.resumeUrl ?? existing.resumeUrl,
            linkedInUrl: data.linkedInUrl ?? existing.linkedInUrl,
            portfolioUrl: data.portfolioUrl ?? existing.portfolioUrl,
            coverLetter: data.coverLetter ?? existing.coverLetter,
            source: data.source ?? existing.source,
          },
          include: { pipelineStage: true },
        });
      }
      throw new AppError('A candidate with this email already exists for this job. Use merge option to update.', 400);
    }

    if (!data.resumeUrl?.trim()) {
      throw new AppError('Resume/CV is required when adding a new candidate', 400);
    }
    if (!data.source?.trim()) {
      throw new AppError('Source is required when adding a new candidate (e.g. LinkedIn, Referral)', 400);
    }

    return prisma.recruitmentCandidate.create({
      data: {
        jobPostingId,
        email: emailNorm,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        currentCompany: data.currentCompany,
        currentTitle: data.currentTitle,
        resumeUrl: data.resumeUrl?.trim() || undefined,
        linkedInUrl: data.linkedInUrl?.trim() || undefined,
        portfolioUrl: data.portfolioUrl?.trim() || undefined,
        coverLetter: data.coverLetter,
        source: data.source,
        pipelineStageId: firstStageId,
        status: 'ADDED',
        addedById: accountId,
      },
      include: { pipelineStage: true },
    });
  }

  /** Import candidates from CSV (email, firstName, lastName, phone, currentCompany, currentTitle, resumeUrl, source) */
  async importCandidates(accountId: string, jobPostingId: string, csv: string) {
    await this.ensureJobAccess(accountId, jobPostingId);

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: { pipeline: { include: { stages: { orderBy: { order: 'asc' }, take: 1 } } } },
    });
    if (!job) throw new AppError('Job not found', 404);
    const firstStageId = job.pipeline?.stages?.[0]?.id ?? null;

    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new AppError('CSV must have header and at least one row', 400);

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const emailIdx = header.findIndex((h) => h === 'email' || h === 'e-mail');
    const firstNameIdx = header.findIndex((h) => h === 'firstname' || h === 'first name' || h === 'first_name');
    const lastNameIdx = header.findIndex((h) => h === 'lastname' || h === 'last name' || h === 'last_name');
    const phoneIdx = header.findIndex((h) => h === 'phone' || h === 'phone number');
    const companyIdx = header.findIndex((h) => h === 'company' || h === 'current company' || h === 'current_company');
    const titleIdx = header.findIndex((h) => h === 'title' || h === 'current title' || h === 'current_title');
    const resumeIdx = header.findIndex((h) => h === 'resume' || h === 'resumeurl' || h === 'resume_url');
    const linkedInIdx = header.findIndex((h) => h === 'linkedin' || h === 'linkedinurl' || h === 'linkedin_url');
    const portfolioIdx = header.findIndex((h) => h === 'portfolio' || h === 'portfoliourl' || h === 'portfolio_url');
    const sourceIdx = header.findIndex((h) => h === 'source');

    if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
      throw new AppError('CSV must include columns: email, firstName (or first name), lastName (or last name)', 400);
    }

    const created: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const email = cells[emailIdx] || '';
      const firstName = cells[firstNameIdx] || '';
      const lastName = cells[lastNameIdx] || '';
      if (!email || !firstName || !lastName) {
        errors.push(`Row ${i + 1}: missing email, first name, or last name`);
        continue;
      }

      try {
        const candidate = await prisma.recruitmentCandidate.upsert({
          where: { jobPostingId_email: { jobPostingId, email } },
          create: {
            jobPostingId,
            email,
            firstName,
            lastName,
            phone: phoneIdx >= 0 ? cells[phoneIdx] : undefined,
            currentCompany: companyIdx >= 0 ? cells[companyIdx] : undefined,
            currentTitle: titleIdx >= 0 ? cells[titleIdx] : undefined,
            resumeUrl: resumeIdx >= 0 ? cells[resumeIdx] : undefined,
            linkedInUrl: linkedInIdx >= 0 ? cells[linkedInIdx] : undefined,
            portfolioUrl: portfolioIdx >= 0 ? cells[portfolioIdx] : undefined,
            source: sourceIdx >= 0 ? cells[sourceIdx] : undefined,
            pipelineStageId: firstStageId,
            status: 'ADDED',
            addedById: accountId,
          },
          update: {},
          include: { pipelineStage: true },
        });
        created.push(candidate);
      } catch (e) {
        errors.push(`Row ${i + 1}: ${(e as Error).message}`);
      }
    }

    return { created: created.length, candidates: created, errors };
  }

  /** Create interview for an application or recruitment candidate */
  async createInterview(accountId: string, data: {
    jobApplicationId?: string;
    recruitmentCandidateId?: string;
    type: string;
    round?: number;
    scheduledAt: string;
    durationMinutes?: number;
    locationOrLink?: string;
    feedbackFormType?: string; // TECHNICAL, BEHAVIORAL, HIRING_MANAGER, PANEL, EXECUTIVE
    reminderHoursBefore?: number[]; // e.g. [24, 1] for 24h and 1h before
    interviewerIds?: string[];
  }) {
    const { jobApplicationId, recruitmentCandidateId, interviewerIds, feedbackFormType, reminderHoursBefore, ...rest } = data;
    if (!jobApplicationId && !recruitmentCandidateId) throw new AppError('Provide jobApplicationId or recruitmentCandidateId', 400);
    if (jobApplicationId && recruitmentCandidateId) throw new AppError('Provide only one of jobApplicationId or recruitmentCandidateId', 400);

    let jobPostingId: string;
    if (jobApplicationId) {
      const app = await prisma.jobApplication.findUnique({ where: { id: jobApplicationId }, select: { jobPostingId: true } });
      if (!app) throw new AppError('Application not found', 404);
      jobPostingId = app.jobPostingId;
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({ where: { id: recruitmentCandidateId! }, select: { jobPostingId: true } });
      if (!cand) throw new AppError('Candidate not found', 404);
      jobPostingId = cand.jobPostingId;
    }
    await this.ensureJobAccess(accountId, jobPostingId);

    const interview = await prisma.interview.create({
      data: {
        jobApplicationId: jobApplicationId || undefined,
        recruitmentCandidateId: recruitmentCandidateId || undefined,
        type: rest.type,
        round: rest.round ?? 1,
        scheduledAt: new Date(rest.scheduledAt),
        durationMinutes: rest.durationMinutes,
        locationOrLink: rest.locationOrLink,
        feedbackFormType: feedbackFormType || undefined,
        reminderHoursBefore: reminderHoursBefore?.length ? reminderHoursBefore : undefined,
        createdById: accountId,
        interviewers: interviewerIds?.length
          ? { create: interviewerIds.map((aid) => ({ accountId: aid })) }
          : undefined,
      },
      include: {
        interviewers: { include: { account: { select: { id: true, displayName: true } } } },
      },
    });
    return interview;
  }

  /** Attach or update feedback form type for an interview (addFeedbackForm) */
  async addFeedbackForm(accountId: string, interviewId: string, feedbackFormType: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { jobApplication: { select: { jobPostingId: true } }, recruitmentCandidate: { select: { jobPostingId: true } } },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    const jobPostingId = interview.jobApplication?.jobPostingId ?? interview.recruitmentCandidate?.jobPostingId;
    if (!jobPostingId) throw new AppError('Interview has no linked candidate', 400);
    await this.ensureJobAccess(accountId, jobPostingId);
    const valid = ['TECHNICAL', 'BEHAVIORAL', 'HIRING_MANAGER', 'PANEL', 'EXECUTIVE'].includes(feedbackFormType);
    if (!valid) throw new AppError('Invalid feedback form type', 400);
    return prisma.interview.update({
      where: { id: interviewId },
      data: { feedbackFormType },
      include: { feedbacks: true, interviewers: true },
    });
  }

  /** Send email to candidate via MOxE MAIL (webhook, Resend, SendGrid, or opt-in SES — see `moxe-mail.service.ts`). */
  async sendEmailToCandidate(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    data: { templateId?: string; template?: string; subject?: string; body?: string; personalization?: Record<string, string> }
  ) {
    const candidate = await this.getCandidate(accountId, kind, candidateId);
    const email = kind === 'recruitment' ? (candidate as any).email : (candidate as any).account?.email ?? null;
    const firstName = kind === 'application'
      ? (candidate as any).account?.displayName?.split(' ')[0] || 'Candidate'
      : (candidate as any).firstName || 'Candidate';
    const personalization = { FirstName: firstName, ...data.personalization };
    const subject = data.subject || (data.templateId === 'REJECTION' ? 'Update on your application' : 'Message from recruiter');
    const body = data.body || `Hello ${personalization.FirstName}, this is a message from your recruiter.`;

    if (email) {
      const result = await sendCandidateEmail({
        to: email,
        subject,
        body,
        templateId: data.templateId,
        personalization: Object.fromEntries(Object.entries(personalization).map(([k, v]) => [k, String(v)])),
      });
      return {
        sent: result.sent,
        to: email,
        subject,
        message: result.message,
        templateId: data.templateId,
        personalization,
        provider: result.provider,
      };
    }
    return {
      sent: false,
      to: '[resolve via MOxE PROFILE]',
      subject,
      message: 'Candidate email not found. Add MOxE PROFILE integration or use recruitment candidate with email.',
      templateId: data.templateId,
      personalization,
    };
  }

  /** Send calendar invites via MOxE CALENDAR webhook or Google Calendar (see `moxe-calendar.service.ts`). */
  async sendInterviewInvites(accountId: string, interviewId: string) {
    const interview = await this.getInterview(accountId, interviewId);
    const candidateEmail = (interview.jobApplication?.account as any)?.email
      ?? (interview.recruitmentCandidate ? (interview.recruitmentCandidate as any).email : null);
    const interviewerIds = interview.interviewers?.map((i: any) => i.accountId) ?? [];
    const reminderHours = Array.isArray(interview.reminderHoursBefore)
      ? (interview.reminderHoursBefore as number[])
      : [24, 1];
    const jobTitle = (interview.jobApplication as any)?.jobPosting?.title
      ?? (interview.recruitmentCandidate as any)?.jobPosting?.title
      ?? 'Interview';
    const result = await createInterviewEvent({
      interviewId,
      title: `${jobTitle} – Interview`,
      scheduledAt: new Date(interview.scheduledAt),
      durationMinutes: interview.durationMinutes ?? 60,
      locationOrLink: interview.locationOrLink ?? undefined,
      candidateEmail: candidateEmail ?? undefined,
      interviewerIds,
      reminderHoursBefore: reminderHours.length ? reminderHours : [24, 1],
    });
    return {
      sent: result.created,
      interviewId,
      candidateNotified: !!candidateEmail,
      interviewersNotified: interviewerIds.length,
      message: result.message,
      provider: result.provider,
      eventId: result.eventId,
    };
  }

  /** Add interviewers to an interview */
  async selectInterviewers(accountId: string, interviewId: string, interviewerIds: string[]) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { jobApplicationId: true, recruitmentCandidateId: true },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    const jobPostingId = interview.jobApplicationId
      ? (await prisma.jobApplication.findUnique({ where: { id: interview.jobApplicationId }, select: { jobPostingId: true } }))?.jobPostingId
      : (await prisma.recruitmentCandidate.findUnique({ where: { id: interview.recruitmentCandidateId! }, select: { jobPostingId: true } }))?.jobPostingId;
    if (!jobPostingId) throw new AppError('Interview has no linked candidate', 400);
    await this.ensureJobAccess(accountId, jobPostingId);

    await prisma.interviewInterviewer.deleteMany({ where: { interviewId } });
    if (interviewerIds.length > 0) {
      await prisma.interviewInterviewer.createMany({
        data: interviewerIds.map((accountId) => ({ interviewId, accountId })),
        skipDuplicates: true,
      });
    }
    return prisma.interview.findUnique({
      where: { id: interviewId },
      include: { interviewers: { include: { account: { select: { id: true, displayName: true } } } } },
    });
  }

  /** Submit feedback for an interview */
  async addFeedback(accountId: string, interviewId: string, data: { rating?: number; recommendation?: string; comment?: string }) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { jobApplication: { select: { jobPostingId: true } }, recruitmentCandidate: { select: { jobPostingId: true } } },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    const jobPostingId = interview.jobApplication?.jobPostingId ?? interview.recruitmentCandidate?.jobPostingId;
    if (!jobPostingId) throw new AppError('Interview has no linked candidate', 400);
    await this.ensureJobAccess(accountId, jobPostingId);

    const existing = await prisma.interviewFeedback.findUnique({
      where: { interviewId_accountId: { interviewId, accountId } },
    });
    if (existing) {
      return prisma.interviewFeedback.update({
        where: { id: existing.id },
        data: { rating: data.rating, recommendation: data.recommendation, comment: data.comment },
        include: { account: { select: { id: true, displayName: true } } },
      });
    }
    return prisma.interviewFeedback.create({
      data: {
        interviewId,
        accountId,
        rating: data.rating,
        recommendation: data.recommendation,
        comment: data.comment,
      },
      include: { account: { select: { id: true, displayName: true } } },
    });
  }

  /** List feedback for an interview with aggregated scores (collectFeedback spec). */
  async getInterviewFeedback(accountId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { jobApplication: { select: { jobPostingId: true } }, recruitmentCandidate: { select: { jobPostingId: true } } },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    const jobPostingId = interview.jobApplication?.jobPostingId ?? interview.recruitmentCandidate?.jobPostingId;
    if (!jobPostingId) throw new AppError('Interview has no linked candidate', 400);
    await this.ensureJobAccess(accountId, jobPostingId);

    const list = await prisma.interviewFeedback.findMany({
      where: { interviewId },
      include: { account: { select: { id: true, displayName: true } } },
    });

    const ratings = list.map((f) => f.rating).filter((r): r is number => r != null);
    const recs = list.map((f) => f.recommendation).filter((r): r is string => !!r);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const tally: Record<string, number> = {};
    for (const r of recs) {
      tally[r] = (tally[r] || 0) + 1;
    }
    const hireLike = recs.filter((r) => ['HIRE', 'STRONG_YES', 'YES'].includes(r)).length;
    const noLike = recs.filter((r) => r === 'NO_HIRE' || r === 'NO').length;
    const hasConflict =
      (ratings.length >= 2 && Math.max(...ratings) - Math.min(...ratings) >= 2) ||
      (hireLike > 0 && noLike > 0);

    return {
      feedbacks: list,
      aggregated: {
        averageRating: avg != null ? Math.round(avg * 10) / 10 : null,
        recommendationTally: tally,
        hasConflict: !!hasConflict,
      },
    };
  }

  /** Mark interview as completed */
  async completeInterview(accountId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { jobApplication: { select: { jobPostingId: true } }, recruitmentCandidate: { select: { jobPostingId: true } } },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    const jobPostingId = interview.jobApplication?.jobPostingId ?? interview.recruitmentCandidate?.jobPostingId;
    if (!jobPostingId) throw new AppError('Interview has no linked candidate', 400);
    await this.ensureJobAccess(accountId, jobPostingId);

    return prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'COMPLETED' },
      include: { feedbacks: true, interviewers: true },
    });
  }

  /** Make decision on candidate (ADVANCE, REJECT, OFFER, HOLD) */
  async makeDecision(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    data: { decision: string; decisionReason?: string }
  ) {
    const valid = ['ADVANCE', 'REJECT', 'OFFER', 'HOLD'].includes(data.decision);
    if (!valid) throw new AppError('Invalid decision. Use ADVANCE, REJECT, OFFER, or HOLD', 400);

    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!app) throw new AppError('Application not found', 404);
      await this.ensureJobAccess(accountId, app.jobPostingId);
      return prisma.jobApplication.update({
        where: { id: candidateId },
        data: {
          decision: data.decision,
          decisionReason: data.decisionReason,
          decidedAt: new Date(),
          decidedById: accountId,
          status: data.decision === 'REJECT' ? 'REJECTED' : data.decision === 'OFFER' ? 'OFFER' : undefined,
        },
        include: { pipelineStage: true, decidedBy: { select: { id: true, displayName: true } } },
      });
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!cand) throw new AppError('Candidate not found', 404);
      await this.ensureJobAccess(accountId, cand.jobPostingId);
      return prisma.recruitmentCandidate.update({
        where: { id: candidateId },
        data: {
          status: data.decision === 'REJECT' ? 'REJECTED' : data.decision === 'OFFER' ? 'OFFER' : data.decision === 'ADVANCE' ? 'INTERVIEW' : 'ADDED',
        },
        include: { pipelineStage: true },
      });
    }
  }

  /** Send rejection (update status to REJECTED; template for future MOxE MAIL). */
  async sendRejection(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    options?: { reason?: string; sendEmail?: boolean; template?: 'POST_APPLICATION' | 'POST_INTERVIEW' | 'POSITION_FILLED' | 'GENERIC' }
  ) {
    if (kind === 'application') {
      const app = await prisma.jobApplication.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!app) throw new AppError('Application not found', 404);
      await this.ensureJobAccess(accountId, app.jobPostingId);
      const updated = await prisma.jobApplication.update({
        where: { id: candidateId },
        data: { status: 'REJECTED', decision: 'REJECT', decidedAt: new Date(), decidedById: accountId },
        include: { account: { select: { id: true, displayName: true } }, jobPosting: { select: { title: true } } },
      });
      return { ...updated, emailSent: false, templateUsed: options?.template || 'GENERIC' };
    } else {
      const cand = await prisma.recruitmentCandidate.findUnique({ where: { id: candidateId }, select: { jobPostingId: true } });
      if (!cand) throw new AppError('Candidate not found', 404);
      await this.ensureJobAccess(accountId, cand.jobPostingId);
      const updated = await prisma.recruitmentCandidate.update({
        where: { id: candidateId },
        data: { status: 'REJECTED' },
        include: { jobPosting: { select: { title: true } } },
      });
      return { ...updated, emailSent: false, templateUsed: options?.template || 'GENERIC' };
    }
  }

  /** Get interview by id */
  async getInterview(accountId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        jobApplication: { include: { account: true, jobPosting: { select: { id: true, title: true } } } },
        recruitmentCandidate: true,
        feedbacks: { include: { account: { select: { id: true, displayName: true } } } },
        interviewers: { include: { account: { select: { id: true, displayName: true } } } },
        createdBy: { select: { id: true, displayName: true } },
      },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    const jobPostingId = interview.jobApplication?.jobPostingId ?? interview.recruitmentCandidate?.jobPostingId;
    if (!jobPostingId) throw new AppError('Interview has no linked candidate', 400);
    await this.ensureJobAccess(accountId, jobPostingId);
    return interview;
  }

  /** Update pipeline stages for a job's pipeline. Spec: at least 3 stages required. */
  async updatePipelineStages(accountId: string, pipelineId: string, stageNames: string[]) {
    const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId }, select: { accountId: true } });
    if (!pipeline || pipeline.accountId !== accountId) throw new AppError('Pipeline not found or access denied', 404);
    if (!stageNames || stageNames.length < 3) {
      throw new AppError('At least 3 pipeline stages are required', 400);
    }

    await prisma.pipelineStage.deleteMany({ where: { pipelineId } });
    for (let order = 0; order < stageNames.length; order++) {
      await prisma.pipelineStage.create({ data: { pipelineId, name: stageNames[order], order } });
    }
    return prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  /** Bulk move multiple candidates to a target stage */
  async bulkMoveCandidates(
    accountId: string,
    jobPostingId: string,
    data: { candidateIds: { kind: 'application' | 'recruitment'; id: string }[]; pipelineStageId: string; status?: string }
  ) {
    await this.ensureJobAccess(accountId, jobPostingId);
    const results: { id: string; kind: string; success: boolean; error?: string }[] = [];
    for (const { kind, id } of data.candidateIds) {
      try {
        await this.moveCandidate(accountId, kind, id, {
          pipelineStageId: data.pipelineStageId,
          status: data.status,
        });
        results.push({ id, kind, success: true });
      } catch (e) {
        results.push({ id, kind, success: false, error: (e as Error).message });
      }
    }
    return { moved: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
  }

  /** Get CSV template for candidate import (required columns + example row). Verifies job access. */
  async getCandidatesImportTemplate(accountId: string, jobPostingId: string): Promise<string> {
    await this.ensureJobAccess(accountId, jobPostingId);
    const header = 'email,firstName,lastName,phone,currentCompany,currentTitle,resumeUrl,linkedInUrl,portfolioUrl,source';
    const example = 'jane@example.com,Jane,Doe,+1234567890,Acme Inc,Software Engineer,https://example.com/resume.pdf,https://linkedin.com/in/jane,https://jane.dev,LinkedIn';
    return `${header}\n${example}`;
  }

  /** Check if a candidate with this email already exists for the job (for merge option) */
  async getExistingCandidateByEmail(accountId: string, jobPostingId: string, email: string) {
    await this.ensureJobAccess(accountId, jobPostingId);
    const existing = await prisma.recruitmentCandidate.findUnique({
      where: { jobPostingId_email: { jobPostingId, email: email.trim().toLowerCase() } },
      include: { pipelineStage: true },
    });
    return existing;
  }

  /** Create offer for a candidate (application or recruitment). Candidate must be in OFFER stage or will be moved. */
  async createOffer(
    accountId: string,
    kind: 'application' | 'recruitment',
    candidateId: string,
    data: {
      title?: string;
      body: string;
      compensationSummary?: string;
      proposedStartDate?: Date;
      expiresAt?: Date;
    }
  ) {
    const candidate = await this.getCandidate(accountId, kind, candidateId);
    const jobPostingId = kind === 'application' ? (candidate as any).jobPostingId : (candidate as any).jobPostingId;
    const job = await prisma.jobPosting.findUnique({ where: { id: jobPostingId }, select: { title: true } });
    const payload: any = {
      jobPostingId,
      title: data.title ?? (job ? `Offer – ${job.title}` : 'Offer'),
      body: data.body,
      compensationSummary: data.compensationSummary ?? undefined,
      proposedStartDate: data.proposedStartDate ?? undefined,
      expiresAt: data.expiresAt ?? undefined,
      createdById: accountId,
    };
    if (kind === 'application') {
      payload.jobApplicationId = candidateId;
    } else {
      payload.recruitmentCandidateId = candidateId;
    }
    const offer = await prisma.offer.create({
      data: payload,
      include: {
        jobPosting: { select: { id: true, title: true } },
        createdBy: { select: { id: true, displayName: true } },
      },
    });
    return offer;
  }

  /** Get offer for a candidate (most recent if multiple). */
  async getOfferForCandidate(accountId: string, kind: 'application' | 'recruitment', candidateId: string) {
    const candidate = await this.getCandidate(accountId, kind, candidateId);
    const jobPostingId = (candidate as any).jobPostingId;
    const where = kind === 'application'
      ? { jobApplicationId: candidateId, jobPostingId }
      : { recruitmentCandidateId: candidateId, jobPostingId };
    const offer = await prisma.offer.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        jobPosting: { select: { id: true, title: true, companyName: true } },
        createdBy: { select: { id: true, displayName: true } },
      },
    });
    return offer;
  }

  /** Get offer by id. */
  async getOffer(accountId: string, offerId: string) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        jobPosting: true,
        jobApplication: { include: { account: { select: { id: true, displayName: true } } } },
        recruitmentCandidate: true,
        createdBy: { select: { id: true, displayName: true } },
      },
    });
    if (!offer) throw new AppError('Offer not found', 404);
    await this.ensureJobAccess(accountId, offer.jobPostingId);
    return offer;
  }

  /** Send offer (set status to SENT, set sentAt). Optionally send email via MOxE MAIL. */
  async sendOffer(accountId: string, offerId: string, options?: { sendEmail?: boolean }) {
    const offer = await this.getOffer(accountId, offerId);
    if (offer.status !== 'DRAFT') throw new AppError('Offer is already sent or responded to', 400);
    const updated: any = await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'SENT', sentAt: new Date() },
      include: {
        jobPosting: { select: { id: true, title: true } },
        jobApplication: { include: { account: { select: { id: true, displayName: true } } } },
        recruitmentCandidate: true,
      },
    });
    if (options?.sendEmail) {
      const to = updated.jobApplication?.account?.email ?? (updated.recruitmentCandidate as any)?.email;
      if (to) {
        const { sendCandidateEmail } = await import('./moxe-mail.service');
        await sendCandidateEmail({
          to,
          subject: `Offer: ${updated.jobPosting?.title ?? 'Position'}`,
          body: updated.body,
          personalization: { FirstName: updated.jobApplication?.account?.displayName?.split(' ')[0] ?? (updated.recruitmentCandidate as any)?.firstName ?? 'Candidate' },
        });
      }
    }
    return updated;
  }

  /** Set offer outcome (ACCEPTED or DECLINED). */
  async setOfferOutcome(accountId: string, offerId: string, outcome: 'ACCEPTED' | 'DECLINED') {
    const offer = await this.getOffer(accountId, offerId);
    if (offer.status !== 'SENT') throw new AppError('Only sent offers can be accepted or declined', 400);
    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: outcome, respondedAt: new Date() },
      include: { jobPosting: { select: { id: true } }, jobApplication: true, recruitmentCandidate: true },
    });
    return updated;
  }
}
