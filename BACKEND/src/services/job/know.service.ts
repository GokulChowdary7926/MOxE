import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export class KnowService {
  async getCompanies(search?: string) {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};
    return prisma.company.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  async getCompanyBySlug(slug: string) {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        reviews: { take: 10, orderBy: { createdAt: 'desc' } },
        salaryEntries: { take: 20 },
        careerResources: { take: 20 },
      },
    });
    if (!company) throw new AppError('Company not found', 404);
    return company;
  }

  async createCompany(data: {
    name: string;
    slug?: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    headquarters?: string;
    description?: string;
  }) {
    const slug = data.slug || slugify(data.name);
    const existing = await prisma.company.findUnique({ where: { slug } });
    if (existing) throw new AppError('Company with this slug already exists', 400);
    return prisma.company.create({
      data: { ...data, slug },
    });
  }

  async addReview(accountId: string, companyId: string, data: {
    rating: number;
    pros?: string;
    cons?: string;
    summary?: string;
    isAnonymous?: boolean;
  }) {
    return prisma.companyReview.upsert({
      where: { accountId_companyId: { accountId, companyId } },
      create: { accountId, companyId, ...data },
      update: data,
    });
  }

  async addSalary(accountId: string, companyId: string, data: {
    role: string;
    amount: number;
    currency?: string;
    period?: string;
    experienceLevel?: string;
    isAnonymous?: boolean;
  }) {
    return prisma.salaryEntry.create({
      data: { accountId, companyId, ...data },
    });
  }

  async getCareerResources(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return prisma.careerResource.findMany({
      where: { ...where, isPublic: true },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createCareerResource(accountId: string, data: {
    title: string;
    content: string;
    companyId?: string;
    type?: string;
  }) {
    return prisma.careerResource.create({
      data: {
        accountId,
        title: data.title,
        content: data.content,
        companyId: data.companyId,
        type: data.type || 'ARTICLE',
        isPublic: true,
      },
    });
  }

  async getInterviewPreps(accountId: string, companyId?: string) {
    const where: { accountId: string; companyId?: string } = { accountId };
    if (companyId) where.companyId = companyId;
    return prisma.interviewPrep.findMany({
      where,
      include: { company: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createInterviewPrep(accountId: string, data: {
    title: string;
    content: string;
    companyId?: string;
    jobPostingId?: string;
  }) {
    return prisma.interviewPrep.create({
      data: { accountId, ...data },
    });
  }
}
