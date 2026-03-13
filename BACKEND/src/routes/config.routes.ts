/**
 * Config endpoints for client (e.g. 3.4 DRM: screenshot block, watermark URL prefix).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

/** 3.4 DRM: client uses this to enable screenshot/capture block and optional watermarked media URLs. */
router.get('/drm', authenticate, (_req, res) => {
  const screenshotBlockEnabled = process.env.DRM_SCREENSHOT_BLOCK === 'true';
  const watermarkMediaUrlPrefix = process.env.DRM_WATERMARK_MEDIA_URL_PREFIX || null;
  res.json({
    screenshotBlockEnabled,
    watermarkMediaUrlPrefix,
    message: screenshotBlockEnabled
      ? 'Client should prevent screenshot/recording when displaying protected content.'
      : undefined,
  });
});

export default router;
