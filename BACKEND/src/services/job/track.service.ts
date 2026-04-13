import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'job';
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ');
}

export class TrackService {
  async getApplications(accountId: string) {
    return prisma.jobApplication.findMany({
      where: { accountId },
      include: {
        jobPosting: true,
        pipelineStage: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async getApplication(accountId: string, applicationId: string) {
    const app = await prisma.jobApplication.findFirst({
      where: { id: applicationId, accountId },
      include: {
        jobPosting: { include: { company: true } },
        pipelineStage: true,
      },
    });
    if (!app) throw new AppError('Application not found', 404);
    return app;
  }

  /** Job seeker updates their application stage (Kanban / pipeline UI). */
  async updateApplicationStatus(accountId: string, applicationId: string, status: string) {
    const allowed = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];
    const next = (status || '').toUpperCase();
    if (!allowed.includes(next)) {
      throw new AppError(`Invalid status. Use one of: ${allowed.join(', ')}`, 400);
    }
    const existing = await prisma.jobApplication.findFirst({
      where: { id: applicationId, accountId },
    });
    if (!existing) throw new AppError('Application not found', 404);
    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: next },
      include: {
        jobPosting: true,
        pipelineStage: true,
      },
    });
  }

  async apply(accountId: string, jobPostingId: string, data: { coverLetter?: string; resumeUrl?: string }) {
    const existing = await prisma.jobApplication.findUnique({
      where: { accountId_jobPostingId: { accountId, jobPostingId } },
    });
    if (existing) throw new AppError('Already applied to this job', 400);

    const app = await prisma.jobApplication.create({
      data: {
        accountId,
        jobPostingId,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
      },
      include: { jobPosting: true },
    });

    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: { applicationCount: { increment: 1 } },
    });
    return app;
  }

  async getPipelines(accountId: string) {
    return prisma.pipeline.findMany({
      where: { accountId },
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPipeline(accountId: string, name: string, stageNames?: string[]) {
    if (stageNames && stageNames.length > 0 && stageNames.length < 3) {
      throw new AppError('At least 3 pipeline stages are required', 400);
    }
    const pipeline = await prisma.pipeline.create({
      data: {
        accountId,
        name,
        stages: stageNames?.length
          ? { create: stageNames.map((stageName, order) => ({ name: stageName, order })) }
          : undefined,
      },
      include: { stages: true },
    });
    return pipeline;
  }

  async getJobPostings(accountId?: string, status: string = 'OPEN', myOnly?: boolean) {
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    else if (!accountId || !myOnly) where.status = 'OPEN';
    if (accountId && myOnly) {
      where.OR = [{ postedById: accountId }, { recruiterId: accountId }, { hiringManagerId: accountId }];
    }
    return prisma.jobPosting.findMany({
      where,
      include: {
        company: true,
        postedBy: { select: { id: true, username: true, displayName: true } },
        hiringManager: { select: { id: true, username: true, displayName: true } },
        recruiter: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobPosting(jobPostingId: string, accountId?: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        company: true,
        postedBy: { select: { id: true, username: true, displayName: true } },
        hiringManager: { select: { id: true, username: true, displayName: true } },
        recruiter: { select: { id: true, username: true, displayName: true } },
        pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!job) throw new AppError('Job not found', 404);
    return job;
  }

  /** Accounts that can be assigned as hiring manager or recruiter (setHiringManager / setRecruiter). */
  async getAccountsForAssignment(accountId: string) {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        OR: [
          { postedById: accountId },
          { recruiterId: accountId },
          { hiringManagerId: accountId },
        ],
      },
      select: { postedById: true, hiringManagerId: true, recruiterId: true },
    });
    const ids = new Set<string>();
    ids.add(accountId);
    for (const j of jobs) {
      if (j.postedById) ids.add(j.postedById);
      if (j.hiringManagerId) ids.add(j.hiringManagerId);
      if (j.recruiterId) ids.add(j.recruiterId);
    }
    const accounts = await prisma.account.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, displayName: true, username: true },
      orderBy: { displayName: 'asc' },
    });
    return accounts;
  }

  /** Suggest similar job titles from account's history (for setJobTitle / duplicate awareness) */
  async suggestJobTitles(accountId: string, query: string, limit: number = 10) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    const jobs = await prisma.jobPosting.findMany({
      where: {
        OR: [
          { postedById: accountId },
          { recruiterId: accountId },
          { hiringManagerId: accountId },
        ],
        title: { contains: q, mode: 'insensitive' },
      },
      select: { title: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
    const seen = new Set<string>();
    return jobs.map((j) => j.title).filter((t) => { const key = t.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
  }

  async getJobPostingBySlug(slug: string) {
    const job = await prisma.jobPosting.findFirst({
      where: { slug, status: 'OPEN' },
      include: {
        company: true,
        postedBy: { select: { id: true, username: true, displayName: true } },
      },
    });
    if (!job) throw new AppError('Job not found', 404);
    return job;
  }

  async createJobPosting(accountId: string, data: {
    title: string;
    companyName: string;
    companyId?: string;
    department?: string;
    location?: string;
    locationType?: string;
    description?: string;
    descriptionFormat?: string; // plain, markdown, html
    requirements?: string;
    requirementsStructured?: object;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    salaryVisibility?: string;
    bonusPercent?: number;
    equityEligible?: boolean;
    pipelineId?: string;
    hiringManagerId?: string;
    recruiterId?: string;
  }) {
    const title = normalizeTitle(data.title);
    if (title.length < 3 || title.length > 100) {
      throw new AppError('Job title must be between 3 and 100 characters', 400);
    }
    if (data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax) {
      throw new AppError('Salary minimum must be less than or equal to maximum', 400);
    }
    if (data.description != null && data.description.length > 10000) {
      throw new AppError('Job description must not exceed 10,000 characters', 400);
    }
    const similar = await prisma.jobPosting.findFirst({
      where: {
        postedById: accountId,
        status: { in: ['DRAFT', 'OPEN'] },
        title: { equals: title, mode: 'insensitive' },
      },
    });
    if (similar) {
      throw new AppError('An active requisition with this title already exists. Use a different title or edit the existing one.', 400);
    }
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let n = 0;
    while (true) {
      const exists = await prisma.jobPosting.findFirst({ where: { slug } });
      if (!exists) break;
      slug = `${baseSlug}-${++n}`;
    }
    const job = await prisma.jobPosting.create({
      data: {
        ...data,
        title,
        slug,
        postedById: accountId,
      },
    });
    const warnings: string[] = [];
    if (data.description && data.description.length > 0 && data.description.length < 500) {
      warnings.push('Job description is under 500 characters; at least 500 is recommended for best results.');
    }
    return warnings.length > 0 ? { ...job, warnings } : job;
  }

  async updateJobPosting(accountId: string, jobPostingId: string, data: {
    title?: string;
    companyName?: string;
    companyId?: string;
    department?: string;
    location?: string;
    locationType?: string;
    description?: string;
    descriptionFormat?: string;
    requirements?: string;
    requirementsStructured?: object;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    salaryVisibility?: string;
    bonusPercent?: number;
    equityEligible?: boolean;
    pipelineId?: string;
    hiringManagerId?: string;
    recruiterId?: string;
    status?: string;
  }) {
    await this.ensureJobAccess(accountId, jobPostingId);
    if (data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax) {
      throw new AppError('Salary minimum must be less than or equal to maximum', 400);
    }
    if (data.description != null && data.description.length > 10000) {
      throw new AppError('Job description must not exceed 10,000 characters', 400);
    }
    const update: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.title !== undefined) {
      const title = normalizeTitle(data.title);
      if (title.length < 3 || title.length > 100) {
        throw new AppError('Job title must be between 3 and 100 characters', 400);
      }
      (update as any).title = title;
      const baseSlug = slugify(title);
      let slug = baseSlug;
      let n = 0;
      while (true) {
        const existing = await prisma.jobPosting.findFirst({ where: { slug, id: { not: jobPostingId } } });
        if (!existing) break;
        slug = `${baseSlug}-${++n}`;
      }
      (update as any).slug = slug;
    }
    const job = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: update as any,
    });
    const warnings: string[] = [];
    if (job.description && job.description.length > 0 && job.description.length < 500) {
      warnings.push('Job description is under 500 characters; at least 500 is recommended for best results.');
    }
    return warnings.length > 0 ? { ...job, warnings } : job;
  }

  /** Publish job to OPEN; optional destinations (persisted; external push requires MOxE integrations), optional expiresAt */
  async publishJob(accountId: string, jobPostingId: string, options?: { destinations?: string[]; expiresAt?: string }) {
    await this.ensureJobAccess(accountId, jobPostingId);
    const data: Record<string, unknown> = {
      status: 'OPEN',
      publishedAt: new Date(),
      updatedAt: new Date(),
    };
    if (options?.expiresAt) {
      data.expiresAt = new Date(options.expiresAt);
    }
    if (options?.destinations?.length) {
      data.publishedDestinations = options.destinations;
    }
    const job = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: data as any,
    });
    return { job, destinationsAcknowledged: options?.destinations ?? (job as any).publishedDestinations ?? [], message: 'Job published. External boards (LinkedIn, Indeed, etc.) require MOxE integrations for live posting.' };
  }

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
    if (!canAccess) throw new AppError('Not authorized to modify this job', 403);
  }

  async listSavedJobSearches(accountId: string) {
    return prisma.savedJobSearch.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSavedJobSearch(accountId: string, data: {
    name: string;
    query?: string;
    location?: string;
    locationType?: string;
    jobType?: string;
    alertEnabled?: boolean;
  }) {
    return prisma.savedJobSearch.create({
      data: {
        accountId,
        name: data.name,
        query: data.query ?? null,
        location: data.location ?? null,
        locationType: data.locationType ?? null,
        jobType: data.jobType ?? null,
        alertEnabled: data.alertEnabled ?? false,
      },
    });
  }

  async updateSavedJobSearch(accountId: string, searchId: string, data: { alertEnabled?: boolean; name?: string }) {
    await prisma.savedJobSearch.findFirstOrThrow({ where: { id: searchId, accountId } });
    return prisma.savedJobSearch.update({
      where: { id: searchId },
      data: { ...(data.alertEnabled !== undefined && { alertEnabled: data.alertEnabled }), ...(data.name && { name: data.name }) },
    });
  }

  async deleteSavedJobSearch(accountId: string, searchId: string) {
    await prisma.savedJobSearch.findFirstOrThrow({ where: { id: searchId, accountId } });
    await prisma.savedJobSearch.delete({ where: { id: searchId } });
  }
}
