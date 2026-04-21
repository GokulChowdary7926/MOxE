import { Router, Request } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { prisma } from '../server';
import { storeBuffer } from '../services/storage.service';
import {
  recordUploadedAsset,
  listUploadedAssets,
  deleteUploadedAssetForAccount,
} from '../services/uploadRecord.service';

const STORAGE_LIMIT_FREE = 1 * 1024 * 1024 * 1024; // 1GB
const STORAGE_LIMIT_PAID = 5 * 1024 * 1024 * 1024; // 5GB

const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (videos + audio clips)
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm)|audio\/(mpeg|mp3|wav|x-wav|ogg|webm|aac|mp4|x-m4a))$/i;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Use image (jpeg, png, gif, webp), video (mp4, webm), or audio (mp3, wav, ogg, webm, aac, m4a).'));
  },
});

// TRACK attachments: documents, images, archives (100MB)
const trackUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed =
      /^image\//i.test(file.mimetype) ||
      /^video\//i.test(file.mimetype) ||
      /^application\/(pdf|msword|vnd\.openxmlformats|zip|octet-stream)$/i.test(file.mimetype) ||
      /^text\//i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Invalid file type for TRACK attachment.'));
  },
});

const router = Router();

/** Library: all non-deleted uploads for this account (kept until DELETE). */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const result = await listUploadedAssets(accountId, { limit, offset });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Register /track and /multiple before /:id so they are not captured as ids.
router.post('/track', authenticate, trackUpload.single('file'), async (req: Request, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const accountId = (req as any).user?.accountId || (req as any).user?.userId;
  if (accountId) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { storageBytesUsed: true, subscriptionTier: true },
    });
    if (account) {
      const limit =
        account.subscriptionTier === 'STAR' || account.subscriptionTier === 'THICK'
          ? STORAGE_LIMIT_PAID
          : STORAGE_LIMIT_FREE;
      if (account.storageBytesUsed + req.file.size > limit) {
        return res.status(413).json({ error: 'Storage limit exceeded.' });
      }
      await prisma.account.update({
        where: { id: accountId },
        data: { storageBytesUsed: { increment: req.file.size } },
      });
    }
  }
  const stored = await storeBuffer(req.file.buffer, req.file.originalname || 'track.bin', req.file.mimetype);
  let uploadId: string | undefined;
  if (accountId) {
    try {
      const row = await recordUploadedAsset({
        accountId,
        storageKey: stored.key,
        publicUrl: stored.url,
        originalFileName: req.file.originalname || 'track.bin',
        mimeType: req.file.mimetype,
        sizeBytes: stored.size,
        purpose: 'track',
        storageBackend: stored.storageBackend,
      });
      uploadId = row.id;
    } catch (e) {
      console.error('[upload/track] UploadedAsset row failed', e);
    }
  }
  res.json({
    url: stored.url,
    key: stored.key,
    fileName: req.file.originalname || 'track.bin',
    fileSize: req.file.size,
    ...(uploadId ? { id: uploadId } : {}),
  });
});

router.post('/multiple', authenticate, upload.array('files', 10), async (req: Request, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const accountId = (req as any).user?.accountId || (req as any).user?.userId;
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  if (accountId) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { storageBytesUsed: true, subscriptionTier: true },
    });
    if (account) {
      const limit =
        account.subscriptionTier === 'STAR' || account.subscriptionTier === 'THICK'
          ? STORAGE_LIMIT_PAID
          : STORAGE_LIMIT_FREE;
      if (account.storageBytesUsed + totalSize > limit) {
        return res.status(413).json({ error: 'Storage limit exceeded. Upgrade for more space.' });
      }
      await prisma.account.update({
        where: { id: accountId },
        data: { storageBytesUsed: { increment: totalSize } },
      });
    }
  }
  const storedList = await Promise.all(
    files.map((f) => storeBuffer(f.buffer, f.originalname || 'upload.bin', f.mimetype)),
  );
  const objects: Array<{ url: string; key: string; size: number; storageBackend: string; id?: string }> = [];
  if (accountId) {
    for (let i = 0; i < storedList.length; i++) {
      const stored = storedList[i];
      const f = files[i];
      try {
        const row = await recordUploadedAsset({
          accountId,
          storageKey: stored.key,
          publicUrl: stored.url,
          originalFileName: f.originalname || 'upload.bin',
          mimeType: f.mimetype,
          sizeBytes: stored.size,
          purpose: 'batch',
          storageBackend: stored.storageBackend,
        });
        objects.push({ ...stored, id: row.id });
      } catch (e) {
        console.error('[upload/multiple] UploadedAsset row failed', e);
        objects.push({ ...stored });
      }
    }
  } else {
    storedList.forEach((s) => objects.push(s));
  }
  res.json({
    urls: objects.map((o) => o.url),
    objects,
  });
});

router.post('/', authenticate, upload.single('file'), async (req: Request, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const accountId = (req as any).user?.accountId || (req as any).user?.userId;
  if (accountId) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { storageBytesUsed: true, subscriptionTier: true },
    });
    if (account) {
      const limit =
        account.subscriptionTier === 'STAR' || account.subscriptionTier === 'THICK'
          ? STORAGE_LIMIT_PAID
          : STORAGE_LIMIT_FREE;
      if (account.storageBytesUsed + req.file.size > limit) {
        return res.status(413).json({ error: 'Storage limit exceeded. Upgrade for more space.' });
      }
      await prisma.account.update({
        where: { id: accountId },
        data: { storageBytesUsed: { increment: req.file.size } },
      });
    }
  }
  const stored = await storeBuffer(req.file.buffer, req.file.originalname || 'upload.bin', req.file.mimetype);
  let uploadId: string | undefined;
  if (accountId) {
    try {
      const row = await recordUploadedAsset({
        accountId,
        storageKey: stored.key,
        publicUrl: stored.url,
        originalFileName: req.file.originalname || 'upload.bin',
        mimeType: req.file.mimetype,
        sizeBytes: stored.size,
        purpose: 'general',
        storageBackend: stored.storageBackend,
      });
      uploadId = row.id;
    } catch (e) {
      console.error('[upload] UploadedAsset row failed', e);
    }
  }
  res.json({ url: stored.url, key: stored.key, size: stored.size, ...(uploadId ? { id: uploadId } : {}) });
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    await deleteUploadedAssetForAccount(req.params.id, accountId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
