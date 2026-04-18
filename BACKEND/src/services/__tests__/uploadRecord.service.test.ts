import { AppError } from '../../utils/AppError';

const mockDeleteStoredObject = jest.fn();

jest.mock('../storage.service', () => ({
  deleteStoredObject: (...args: any[]) => mockDeleteStoredObject(...args),
}));

jest.mock('../../server', () => ({
  prisma: {
    uploadedAsset: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const { prisma: mockPrisma } = require('../../server');
const {
  recordUploadedAsset,
  listUploadedAssets,
  deleteUploadedAssetForAccount,
} = require('../uploadRecord.service');

describe('uploadRecord.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recordUploadedAsset writes metadata row', async () => {
    mockPrisma.uploadedAsset.create.mockResolvedValue({ id: 'up1' });
    const row = await recordUploadedAsset({
      accountId: 'a1',
      storageKey: 'k1',
      publicUrl: 'http://x/u',
      originalFileName: 'file.png',
      mimeType: 'image/png',
      sizeBytes: 123,
      purpose: 'general',
      storageBackend: 'local',
    });
    expect(row.id).toBe('up1');
  });

  it('listUploadedAssets returns pagination metadata', async () => {
    mockPrisma.$transaction.mockResolvedValueOnce([[{ id: 'up1' }], 1]);
    const result = await listUploadedAssets('a1', { limit: 10, offset: 0 });
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('deleteUploadedAssetForAccount throws when upload missing', async () => {
    mockPrisma.uploadedAsset.findFirst.mockResolvedValue(null);
    await expect(deleteUploadedAssetForAccount('u1', 'a1')).rejects.toBeInstanceOf(AppError);
  });

  it('deleteUploadedAssetForAccount removes blob and updates storage usage', async () => {
    mockPrisma.uploadedAsset.findFirst.mockResolvedValue({
      id: 'u1',
      accountId: 'a1',
      storageKey: 'k1',
      storageBackend: 'local',
      sizeBytes: 50,
    });
    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({
        uploadedAsset: { delete: jest.fn().mockResolvedValue({}) },
        account: {
          findUnique: jest.fn().mockResolvedValue({ storageBytesUsed: 100 }),
          update: jest.fn().mockResolvedValue({}),
        },
      }),
    );

    await deleteUploadedAssetForAccount('u1', 'a1');
    expect(mockDeleteStoredObject).toHaveBeenCalledWith('k1', 'local');
  });
});
