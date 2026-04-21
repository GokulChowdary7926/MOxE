import { S3Client } from '@aws-sdk/client-s3';

let cached: S3Client | null = null;
let cacheKey = '';

function buildCacheKey(): string {
  const region = process.env.AWS_REGION?.trim() || '';
  const useKeys =
    !!process.env.AWS_ACCESS_KEY_ID?.trim() && !!process.env.AWS_SECRET_ACCESS_KEY?.trim();
  return `${region}|${useKeys ? 'keys' : 'role'}`;
}

/**
 * Shared S3 client for uploads/deletes (AWS SDK v3).
 * Region required; uses static keys when set, otherwise default credential chain (e.g. EC2 role).
 */
export function getSharedS3Client(): S3Client | null {
  const region = process.env.AWS_REGION?.trim();
  if (!region) return null;
  const key = buildCacheKey();
  if (cached && cacheKey === key) return cached;
  cacheKey = key;
  const useKeys =
    !!process.env.AWS_ACCESS_KEY_ID?.trim() && !!process.env.AWS_SECRET_ACCESS_KEY?.trim();
  cached = useKeys
    ? new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })
    : new S3Client({ region });
  return cached;
}
