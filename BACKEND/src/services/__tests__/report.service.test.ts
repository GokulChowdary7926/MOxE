import { AppError } from '../../utils/AppError';
import { ReportService } from '../report.service';

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
    },
    story: {
      findUnique: jest.fn(),
    },
    report: {
      create: jest.fn(),
      count: jest.fn(),
    },
    restrict: {
      upsert: jest.fn(),
    },
    anonymousReport: {
      create: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('ReportService', () => {
  const service = new ReportService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.report.create.mockResolvedValue({ id: 'r1' });
  });

  it('create rejects invalid reason', async () => {
    await expect(service.create('u1', { type: 'post', targetId: 'p1', reason: '' as any })).rejects.toBeInstanceOf(AppError);
  });

  it('create validates target and creates post report', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1' });
    const result = await service.create('u1', {
      type: 'post',
      targetId: 'p1',
      reason: 'Spam',
      description: 'bad post',
    });
    expect(result).toEqual({ id: 'r1' });
    expect(mockPrisma.report.create).toHaveBeenCalled();
  });

  it('create account report auto-restricts after 3 reports', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'a2' });
    mockPrisma.report.count.mockResolvedValue(3);
    await service.create('u1', { type: 'account', targetId: 'a2', reason: 'Harassment' });
    expect(mockPrisma.restrict.upsert).toHaveBeenCalled();
  });

  it('createProblemReport creates generic report', async () => {
    const result = await service.createProblemReport('u1', 'Bug', 'Details');
    expect(result).toEqual({ id: 'r1' });
  });

  it('createAnonymous validates type and target requirements', async () => {
    await expect(service.createAnonymous({ type: 'invalid', reason: 'x' })).rejects.toBeInstanceOf(AppError);
    await expect(service.createAnonymous({ type: 'post', reason: 'x' })).rejects.toBeInstanceOf(AppError);
  });
});
