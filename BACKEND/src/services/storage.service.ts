import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

const uploadsDir = path.join(process.cwd(), 'uploads');

function ensureUploadsDir(): void {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_REGION
  );
}

const s3 = new AWS.S3(
  isS3Configured()
    ? {
        region: process.env.AWS_REGION,
      }
    : undefined,
);

export type StorageBackend = 'local' | 's3';

export type StoredObject = {
  url: string;
  key: string;
  size: number;
  storageBackend: StorageBackend;
};

function getLocalBaseUrl(): string {
  const base =
    process.env.UPLOAD_BASE_URL ||
    process.env.API_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5007';
  return base.replace(/\/$/, '');
}

function getCdnBaseUrl(): string | null {
  const cdn = process.env.CDN_BASE_URL || process.env.CLOUDFRONT_URL;
  return cdn ? cdn.replace(/\/$/, '') : null;
}

export async function storeBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<StoredObject> {
  const size = buffer.length;

  if (isS3Configured()) {
    const bucket = process.env.AWS_S3_BUCKET as string;
    const keyPrefix = process.env.AWS_S3_PREFIX || 'uploads';
    const key = `${keyPrefix.replace(/\/$/, '')}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}-${filename}`;

    await s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read',
      })
      .promise();

    const cdnBase = getCdnBaseUrl();
    const bucketBase = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const baseUrl = cdnBase || bucketBase;

    return {
      url: `${baseUrl}/${key}`,
      key,
      size,
      storageBackend: 's3',
    };
  }

  ensureUploadsDir();
  const ext = path.extname(filename) || '.bin';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const filePath = path.join(uploadsDir, name);
  await fs.promises.writeFile(filePath, buffer);

  const baseUrl = getLocalBaseUrl();
  return {
    url: `${baseUrl}/uploads/${name}`,
    key: name,
    size,
    storageBackend: 'local',
  };
}

/** Remove blob from S3 or local uploads/ — key must match storeBuffer output. */
export async function deleteStoredObject(key: string, backend: StorageBackend): Promise<void> {
  if (backend === 's3') {
    if (!isS3Configured()) {
      console.warn('[storage] deleteStoredObject(s3) but S3 not configured; skipping blob delete');
      return;
    }
    const bucket = process.env.AWS_S3_BUCKET as string;
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    return;
  }
  const filePath = path.join(uploadsDir, key);
  try {
    await fs.promises.unlink(filePath);
  } catch (e: any) {
    if (e?.code !== 'ENOENT') throw e;
  }
}

