import { AppError } from '../../utils/AppError';
import { EmergencyContactService } from '../emergencyContact.service';

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    emergencyContact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('EmergencyContactService', () => {
  const service = new EmergencyContactService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists emergency contacts mapped for API', async () => {
    mockPrisma.emergencyContact.findMany.mockResolvedValue([
      {
        id: 'ec1',
        contactId: 'c1',
        relationship: 'Brother',
        isPrimary: true,
        contact: { id: 'c1', username: 'bob', displayName: 'Bob', profilePhoto: null },
      },
    ]);

    const result = await service.list('a1');
    expect(result).toEqual([
      {
        id: 'ec1',
        contactId: 'c1',
        relationship: 'Brother',
        isPrimary: true,
        contact: { id: 'c1', username: 'bob', displayName: 'Bob', profilePhoto: null },
      },
    ]);
  });

  it('rejects adding self as emergency contact', async () => {
    await expect(service.add('a1', 'a1', 'Self')).rejects.toBeInstanceOf(AppError);
  });

  it('rejects missing contact account', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    await expect(service.add('a1', 'missing', 'Friend')).rejects.toBeInstanceOf(AppError);
  });

  it('adds primary contact and clears previous primaries', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'c1' });
    mockPrisma.emergencyContact.create.mockResolvedValue({
      id: 'ec1',
      contactId: 'c1',
      relationship: 'Contact',
      isPrimary: true,
      contact: { id: 'c1', username: 'bob', displayName: 'Bob', profilePhoto: null },
    });

    const result = await service.add('a1', 'c1', '   ', true);
    expect(mockPrisma.emergencyContact.updateMany).toHaveBeenCalledWith({
      where: { accountId: 'a1' },
      data: { isPrimary: false },
    });
    expect(result.relationship).toBe('Contact');
    expect(result.isPrimary).toBe(true);
  });

  it('removes existing emergency contact', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue({ id: 'ec1', accountId: 'a1' });
    await service.remove('a1', 'ec1');
    expect(mockPrisma.emergencyContact.delete).toHaveBeenCalledWith({ where: { id: 'ec1' } });
  });

  it('setPrimary fails for missing record', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue(null);
    await expect(service.setPrimary('a1', 'missing')).rejects.toBeInstanceOf(AppError);
  });
});
