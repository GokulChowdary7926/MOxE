import { Router, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { prisma } from '../server';
import { storeBuffer } from '../services/storage.service';

const STORAGE_LIMIT_FREE = 1 * 1024 * 1024 * 1024;   // 1GB
const STORAGE_LIMIT_PAID = 5 * 1024 * 1024 * 1024;   // 5GB

const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)|video\/(mp4|webm)$/i;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Use image (jpeg, png, gif, webp) or video (mp4, webm).'));
  },
});

// TRACK attachments: documents, images, archives (100MB)
const trackUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\//i.test(file.mimetype) || /^video\//i.test(file.mimetype) ||
      /^application\/(pdf|msword|vnd\.openxmlformats|zip|octet-stream)$/i.test(file.mimetype) ||
      /^text\//i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Invalid file type for TRACK attachment.'));
  },
});

const router = Router();

router.post('/', authenticate, upload.single('file'), async (req: Request, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const accountId = (req as any).user?.accountId || (req as any).user?.userId;
  if (accountId) {
    const account = await prisma.account.findUnique({ where: { id: accountId }, select: { storageBytesUsed: true, subscriptionTier: true } });
    if (account) {
      const limit =
        account.subscriptionTier === 'STAR' || account.subscriptionTier === 'THICK'
          ? STORAGE_LIMIT_PAID
          : STORAGE_LIMIT_FREE;
      if (account.storageBytesUsed + req.file.size > limit) {
        return res.status(413).json({ error: 'Storage limit exceeded. Upgrade for more space.' });
      }
      await prisma.account.update({ where: { id: accountId }, data: { storageBytesUsed: { increment: req.file.size } } });
    }
  }
  const stored = await storeBuffer(req.file.buffer, req.file.originalname || 'upload.bin', req.file.mimetype);
  res.json({ url: stored.url, key: stored.key, size: stored.size });
});

router.post('/multiple', authenticate, upload.array('files', 10), async (req: Request, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const accountId = (req as any).user?.accountId || (req as any).user?.userId;
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  if (accountId) {
    const account = await prisma.account.findUnique({ where: { id: accountId }, select: { storageBytesUsed: true, subscriptionTier: true } });
    if (account) {
      const limit =
        account.subscriptionTier === 'STAR' || account.subscriptionTier === 'THICK'
          ? STORAGE_LIMIT_PAID
          : STORAGE_LIMIT_FREE;
      if (account.storageBytesUsed + totalSize > limit) {
        return res.status(413).json({ error: 'Storage limit exceeded. Upgrade for more space.' });
      }
      await prisma.account.update({ where: { id: accountId }, data: { storageBytesUsed: { increment: totalSize } } });
    }
  }
  const storedList = await Promise.all(
    files.map((f) => storeBuffer(f.buffer, f.originalname || 'upload.bin', f.mimetype))
  );
  res.json({
    urls: storedList.map((s) => s.url),
    objects: storedList,
  });
});

// TRACK agile: attachments (documents, images, etc.)
router.post('/track', authenticate, trackUpload.single('file'), async (req: Request, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const accountId = (req as any).user?.accountId || (req as any).user?.userId;
  if (accountId) {
    const account = await prisma.account.findUnique({ where: { id: accountId }, select: { storageBytesUsed: true, subscriptionTier: true } });
    if (account) {
      const limit =
        account.subscriptionTier === 'STAR' || account.subscriptionTier === 'THICK'
          ? STORAGE_LIMIT_PAID
          : STORAGE_LIMIT_FREE;
      if (account.storageBytesUsed + req.file.size > limit) {
        return res.status(413).json({ error: 'Storage limit exceeded.' });
      }
      await prisma.account.update({ where: { id: accountId }, data: { storageBytesUsed: { increment: req.file.size } } });
    }
  }
  const stored = await storeBuffer(req.file.buffer, req.file.originalname || 'track.bin', req.file.mimetype);
  res.json({ url: stored.url, key: stored.key, fileName: req.file.originalname || 'track.bin', fileSize: req.file.size });
});

export default router;
