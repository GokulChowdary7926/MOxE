// backend/src/controllers/upload.controller.ts

import { Request, Response } from 'express';
import { CDNService } from '../services/cdn.service';
import multer from 'multer';
import { AppError } from '../utils/AppError';

const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed') as any, false);
    }
  },
});

export class UploadController {
  private cdnService: CDNService;

  constructor() {
    this.cdnService = new CDNService();
  }

  /**
   * Upload single file
   */
  uploadSingle = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const folder = req.body.folder || 'uploads';
      const url = await this.cdnService.uploadWithCDN(
        req.file.buffer,
        req.file.mimetype,
        folder,
        { makePublic: true }
      );

      res.json({
        success: true,
        url,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Upload multiple files
   */
  uploadMultiple = async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const folder = req.body.folder || 'uploads';
      const uploads = await Promise.all(
        files.map(async (file) => {
          const url = await this.cdnService.uploadWithCDN(
            file.buffer,
            file.mimetype,
            folder,
            { makePublic: true }
          );

          return {
            url,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          };
        })
      );

      res.json({
        success: true,
        uploads,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Upload with variants (for images)
   */
  uploadWithVariants = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      if (!req.file.mimetype.startsWith('image/')) {
        throw new AppError('Variants only available for images', 400);
      }

      const folder = req.body.folder || 'uploads';
      const variants = await this.cdnService.uploadWithVariants(
        req.file.buffer,
        folder
      );

      res.json({
        success: true,
        variants,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get signed URL for private content
   */
  getSignedUrl = async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

      const url = this.cdnService.generateSignedUrl(key, expiresIn);

      res.json({
        success: true,
        url,
        expiresIn,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Invalidate cache
   */
  invalidateCache = async (req: Request, res: Response) => {
    try {
      const { paths } = req.body;

      if (!paths || !Array.isArray(paths)) {
        throw new AppError('Paths array is required', 400);
      }

      await this.cdnService.invalidateCache(paths);

      res.json({
        success: true,
        message: 'Cache invalidation initiated',
      });
    } catch (error) {
      throw error;
    }
  };
}