import { AppError } from '../../utils/AppError';
import { AccessService } from '../access.service';

jest.mock('../../server', () => ({
  prisma: {
    orgUser: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orgAuditLog: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    org: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    orgRole: {
      create: jest.fn(),
    },
    orgUserGroup: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    orgInvitation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('AccessService', () => {
  const service = new AccessService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('appendSessionLoginAudits writes one audit per membership', async () => {
    mockPrisma.orgUser.findMany.mockResolvedValue([{ orgId: 'o1' }, { orgId: 'o2' }]);
    await service.appendSessionLoginAudits('a1');
    expect(mockPrisma.orgAuditLog.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ action: 'SESSION_LOGIN' })]) }),
    );
  });

  it('listAuditLog rejects non-member', async () => {
    mockPrisma.orgUser.findFirst.mockResolvedValue(null);
    await expect(service.listAuditLog('o1', 'a1')).rejects.toBeInstanceOf(AppError);
  });

  it('createOrg creates org, owner role, and owner orgUser', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ user: { email: 'owner@moxe.app' }, displayName: 'Owner' });
    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({
        org: { create: jest.fn().mockResolvedValue({ id: 'o1', name: 'Org' }) },
        orgRole: { create: jest.fn().mockResolvedValue({ id: 'r1' }) },
        orgUser: { create: jest.fn().mockResolvedValue({ id: 'u1' }) },
      }),
    );

    const org = await service.createOrg('Org', null, 'a1');
    expect(org.id).toBe('o1');
  });

  it('acceptInvitation rejects invalid/expired invite', async () => {
    mockPrisma.orgInvitation.findUnique.mockResolvedValue(null);
    await expect(service.acceptInvitation('bad-token', 'a1')).rejects.toBeInstanceOf(AppError);
  });
});
