import fs from 'fs';
import path from 'path';
import { DeleteObjectCommand, PutObjectCommand, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getSharedS3Client } from '../utils/s3Client';

const uploadsDir = path.join(process.cwd(), 'uploads');

function ensureUploadsDir(): void {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

/** S3 on when bucket + region exist and either static keys OR EC2 instance role (no keys in .env). */
export function isS3Configured(): boolean {
  const bucket = !!process.env.AWS_S3_BUCKET?.trim();
  const region = !!process.env.AWS_REGION?.trim();
  if (!bucket || !region) return false;
  const keys =
    !!process.env.AWS_ACCESS_KEY_ID?.trim() && !!process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const ec2Role =
    process.env.AWS_S3_USE_EC2_ROLE === '1' || process.env.AWS_S3_USE_EC2_ROLE === 'true';
  return keys || ec2Role;
}

export type StorageBackend = 'local' | 's3';

export type StoredObject = {
  url: string;
  key: string;
  size: number;
  storageBackend: StorageBackend;
};

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

    const client = getSharedS3Client();
    if (!client) {
      throw new Error('[storage] S3 client unavailable (check AWS_REGION)');
    }
    // Omit ACL: buckets with "Object Ownership" = ACLs disabled reject ACLs (AccessControlListNotSupported).
    // For browser-readable URLs, use a bucket policy on `uploads/*` and/or CloudFront — not object ACLs.
    const input: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    };
    if (process.env.AWS_S3_OBJECT_ACL === 'public-read') {
      input.ACL = 'public-read';
    }
    await client.send(new PutObjectCommand(input));

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

  // Portable path so Post/Reel/Story JSON in Postgres is not tied to localhost or one hostname
  // (fixes broken media on EC2 when API_URL was unset and clients used a different origin).
  const publicPath = `/uploads/${name}`;
  const override = process.env.UPLOAD_BASE_URL?.trim();
  if (override) {
    const base = override.replace(/\/$/, '');
    return {
      url: `${base}${publicPath}`,
      key: name,
      size,
      storageBackend: 'local',
    };
  }
  return {
    url: publicPath,
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
    const client = getSharedS3Client();
    if (!client) {
      console.warn('[storage] deleteStoredObject(s3) but S3 client unavailable; skipping blob delete');
      return;
    }
    const bucket = process.env.AWS_S3_BUCKET as string;
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }
  const filePath = path.join(uploadsDir, key);
  try {
    await fs.promises.unlink(filePath);
  } catch (e: any) {
    if (e?.code !== 'ENOENT') throw e;
  }
}

