import { TrackService } from '../job/track.service';
import { AppError } from '../../utils/AppError';

jest.mock('../../server', () => ({
  prisma: {
    jobApplication: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    jobPosting: {
      update: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    pipeline: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    savedJobSearch: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('TrackService', () => {
  const service = new TrackService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.jobApplication.findUnique.mockResolvedValue(null);
    mockPrisma.jobApplication.create.mockResolvedValue({ id: 'app1' });
    mockPrisma.jobPosting.update.mockResolvedValue({});
    mockPrisma.jobApplication.findFirst.mockResolvedValue({ id: 'app1', accountId: 'acc1' });
    mockPrisma.jobApplication.findMany.mockResolvedValue([]);
    mockPrisma.jobApplication.update.mockResolvedValue({ id: 'app1', status: 'INTERVIEW' });
    mockPrisma.pipeline.create.mockResolvedValue({ id: 'pipe1' });
    mockPrisma.pipeline.findMany.mockResolvedValue([]);
    mockPrisma.jobPosting.findFirst.mockResolvedValue(null);
    mockPrisma.jobPosting.create.mockResolvedValue({ id: 'job1', title: 'Engineer' });
    mockPrisma.jobPosting.findMany.mockResolvedValue([]);
    mockPrisma.jobPosting.findUnique.mockResolvedValue({
      id: 'job1',
      postedById: 'acc1',
      recruiterId: null,
      hiringManagerId: null,
    });
    mockPrisma.account.findMany.mockResolvedValue([]);
    mockPrisma.savedJobSearch.findMany.mockResolvedValue([]);
    mockPrisma.savedJobSearch.create.mockResolvedValue({ id: 's1', name: 'Backend jobs' });
    mockPrisma.savedJobSearch.findFirstOrThrow.mockResolvedValue({ id: 's1' });
    mockPrisma.savedJobSearch.update.mockResolvedValue({ id: 's1', name: 'Updated' });
    mockPrisma.savedJobSearch.delete.mockResolvedValue({ id: 's1' });
  });

  it('apply succeeds when no duplicate application exists', async () => {
    const result = await service.apply('acc1', 'job1', { coverLetter: 'hello' });
    expect(result).toEqual({ id: 'app1' });
    expect(mockPrisma.jobApplication.create).toHaveBeenCalled();
    expect(mockPrisma.jobPosting.update).toHaveBeenCalled();
  });

  it('apply throws 400 for duplicate application', async () => {
    mockPrisma.jobApplication.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.apply('acc1', 'job1', {})).rejects.toThrow(AppError);
  });

  it('updateApplicationStatus throws 400 for invalid status', async () => {
    await expect(service.updateApplicationStatus('acc1', 'app1', 'not-real')).rejects.toThrow(AppError);
  });

  it('updateApplicationStatus throws 404 when application missing', async () => {
    mockPrisma.jobApplication.findFirst.mockResolvedValue(null);
    await expect(service.updateApplicationStatus('acc1', 'missing', 'APPLIED')).rejects.toThrow(AppError);
  });

  it('createPipeline throws 400 when stage count < 3', async () => {
    await expect(service.createPipeline('acc1', 'Hiring', ['Applied', 'Interview'])).rejects.toThrow(AppError);
  });

  it('createJobPosting throws 400 for invalid title', async () => {
    await expect(
      service.createJobPosting('acc1', { title: 'x', companyName: 'Acme' } as any),
    ).rejects.toThrow(AppError);
  });

  it('createJobPosting throws 400 when salary range invalid', async () => {
    await expect(
      service.createJobPosting('acc1', {
        title: 'Senior Engineer',
        companyName: 'Acme',
        salaryMin: 200000,
        salaryMax: 100000,
      }),
    ).rejects.toThrow(AppError);
  });

  it('publishJob throws 403 when user has no access', async () => {
    mockPrisma.jobPosting.findUnique.mockResolvedValue({
      id: 'job1',
      postedById: 'someone-else',
      recruiterId: null,
      hiringManagerId: null,
    });
    await expect(service.publishJob('acc1', 'job1')).rejects.toThrow(AppError);
  });

  it('saved job search lifecycle works', async () => {
    await expect(service.listSavedJobSearches('acc1')).resolves.toEqual([]);
    await expect(
      service.createSavedJobSearch('acc1', { name: 'Backend jobs', query: 'node', alertEnabled: true }),
    ).resolves.toEqual({ id: 's1', name: 'Backend jobs' });
    await expect(
      service.updateSavedJobSearch('acc1', 's1', { alertEnabled: false, name: 'Updated' }),
    ).resolves.toEqual({ id: 's1', name: 'Updated' });
    await expect(service.deleteSavedJobSearch('acc1', 's1')).resolves.toBeUndefined();
  });

  it('gets application lists and single application', async () => {
    mockPrisma.jobApplication.findMany.mockResolvedValueOnce([{ id: 'app1' }]);
    await expect(service.getApplications('acc1')).resolves.toEqual([{ id: 'app1' }]);

    mockPrisma.jobApplication.findFirst.mockResolvedValueOnce({ id: 'app1' });
    await expect(service.getApplication('acc1', 'app1')).resolves.toEqual({ id: 'app1' });
  });

  it('throws 404 when single application is missing', async () => {
    mockPrisma.jobApplication.findFirst.mockResolvedValueOnce(null);
    await expect(service.getApplication('acc1', 'missing')).rejects.toThrow(AppError);
  });

  it('supports pipeline/job listing and slug lookup', async () => {
    mockPrisma.pipeline.findMany.mockResolvedValueOnce([{ id: 'p1' }]);
    await expect(service.getPipelines('acc1')).resolves.toEqual([{ id: 'p1' }]);

    mockPrisma.jobPosting.findMany.mockResolvedValueOnce([{ id: 'j1' }]);
    await expect(service.getJobPostings('acc1', 'OPEN', true)).resolves.toEqual([{ id: 'j1' }]);

    mockPrisma.jobPosting.findFirst.mockResolvedValueOnce({ id: 'j1', slug: 'eng' });
    await expect(service.getJobPostingBySlug('eng')).resolves.toMatchObject({ id: 'j1' });
  });

  it('throws 404 when job slug is missing', async () => {
    mockPrisma.jobPosting.findFirst.mockResolvedValueOnce(null);
    await expect(service.getJobPostingBySlug('missing')).rejects.toThrow(AppError);
  });

  it('returns job and assignment suggestions', async () => {
    mockPrisma.jobPosting.findUnique.mockResolvedValueOnce({ id: 'job1' });
    await expect(service.getJobPosting('job1', 'acc1')).resolves.toEqual({ id: 'job1' });

    mockPrisma.jobPosting.findMany.mockResolvedValueOnce([
      { postedById: 'acc1', hiringManagerId: 'acc2', recruiterId: 'acc3' },
    ]);
    mockPrisma.account.findMany.mockResolvedValueOnce([
      { id: 'acc1', displayName: 'A', username: 'a' },
      { id: 'acc2', displayName: 'B', username: 'b' },
    ]);
    await expect(service.getAccountsForAssignment('acc1')).resolves.toHaveLength(2);

    mockPrisma.jobPosting.findMany.mockResolvedValueOnce([
      { title: 'Senior Engineer' },
      { title: 'Senior Engineer' },
      { title: 'Staff Engineer' },
    ]);
    await expect(service.suggestJobTitles('acc1', 'engineer')).resolves.toEqual([
      'Senior Engineer',
      'Staff Engineer',
    ]);
    await expect(service.suggestJobTitles('acc1', '   ')).resolves.toEqual([]);
  });

  it('creates and updates job posting happy paths with warnings', async () => {
    mockPrisma.jobPosting.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockPrisma.jobPosting.create.mockResolvedValueOnce({
      id: 'job-new',
      title: 'Senior Engineer',
      description: 'short',
    });
    const created = await service.createJobPosting('acc1', {
      title: '  Senior   Engineer  ',
      companyName: 'Acme',
      description: 'short',
    });
    expect(created).toMatchObject({ id: 'job-new' });
    expect((created as any).warnings).toBeDefined();

    mockPrisma.jobPosting.findUnique.mockResolvedValueOnce({ postedById: 'acc1', recruiterId: null, hiringManagerId: null });
    mockPrisma.jobPosting.findFirst.mockResolvedValueOnce(null);
    mockPrisma.jobPosting.update.mockResolvedValueOnce({
      id: 'job1',
      title: 'Principal Engineer',
      description: 'short',
    });
    const updated = await service.updateJobPosting('acc1', 'job1', { title: 'Principal   Engineer', description: 'short' });
    expect(updated).toMatchObject({ id: 'job1' });
    expect((updated as any).warnings).toBeDefined();
  });

  it('publishes job with destinations and expiry', async () => {
    mockPrisma.jobPosting.findUnique.mockResolvedValueOnce({ postedById: 'acc1', recruiterId: null, hiringManagerId: null });
    mockPrisma.jobPosting.update.mockResolvedValueOnce({ id: 'job1', publishedDestinations: ['LinkedIn'] });
    const result = await service.publishJob('acc1', 'job1', {
      destinations: ['LinkedIn'],
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(result.job).toMatchObject({ id: 'job1' });
    expect(result.destinationsAcknowledged).toEqual(['LinkedIn']);
  });
});
