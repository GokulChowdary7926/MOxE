-- Track where bytes live (local disk vs S3) for safe deletion and library UI.
ALTER TABLE "UploadedAsset" ADD COLUMN "storageBackend" TEXT NOT NULL DEFAULT 'local';
