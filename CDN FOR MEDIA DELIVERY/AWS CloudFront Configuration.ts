// backend/src/services/cdn.service.ts

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

interface CDNConfig {
  distributionId: string;
  domainName: string;
  bucketName: string;
  region: string;
}

export class CDNService {
  private cloudFront: AWS.CloudFront;
  private s3: AWS.S3;
  private config: CDNConfig;

  constructor() {
    this.cloudFront = new AWS.CloudFront({ region: process.env.AWS_REGION });
    this.s3 = new AWS.S3({ region: process.env.AWS_REGION });
    
    this.config = {
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
      domainName: process.env.CLOUDFRONT_DOMAIN!,
      bucketName: process.env.S3_BUCKET!,
      region: process.env.AWS_REGION!,
    };
  }

  /**
   * Generate signed URL for private content
   */
  generateSignedUrl(key: string, expiresIn: number = 3600): string {
    const url = `https://${this.config.domainName}/${key}`;
    const signer = new AWS.CloudFront.Signer(
      process.env.CLOUDFRONT_KEY_PAIR_ID!,
      process.env.CLOUDFRONT_PRIVATE_KEY!.replace(/\\n/g, '\n')
    );

    return signer.getSignedUrl({
      url,
      expires: Math.floor(Date.now() / 1000) + expiresIn,
    });
  }

  /**
   * Invalidate cache for specific paths
   */
  async invalidateCache(paths: string[]): Promise<void> {
    const callerReference = uuidv4();

    await this.cloudFront.createInvalidation({
      DistributionId: this.config.distributionId,
      InvalidationBatch: {
        CallerReference: callerReference,
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    }).promise();
  }

  /**
   * Upload file with CDN optimization
   */
  async uploadWithCDN(
    file: Buffer,
    contentType: string,
    folder: string,
    options?: {
      makePublic?: boolean;
      optimize?: boolean;
    }
  ): Promise<string> {
    const key = `${folder}/${Date.now()}-${uuidv4()}`;

    // Determine if image should be optimized
    if (options?.optimize && contentType.startsWith('image/')) {
      file = await this.optimizeImage(file);
    }

    // Upload to S3
    await this.s3.putObject({
      Bucket: this.config.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: options?.makePublic ? 'public-read' : 'private',
      CacheControl: 'max-age=31536000', // 1 year cache
    }).promise();

    // Return CDN URL
    if (options?.makePublic) {
      return `https://${this.config.domainName}/${key}`;
    } else {
      return key; // Return key for signed URL generation
    }
  }

  /**
   * Optimize image for web delivery
   */
  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    // This would integrate with Sharp or similar image optimization library
    // For now, return original
    return imageBuffer;
  }

  /**
   * Get multiple variants of an image
   */
  async getImageVariants(key: string): Promise<{
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    const baseUrl = `https://${this.config.domainName}`;
    const [path, extension] = key.split('.');

    return {
      original: `${baseUrl}/${key}`,
      thumbnail: `${baseUrl}/${path}_thumb.${extension}`,
      medium: `${baseUrl}/${path}_medium.${extension}`,
      large: `${baseUrl}/${path}_large.${extension}`,
    };
  }

  /**
   * Upload with automatic variant generation
   */
  async uploadWithVariants(
    file: Buffer,
    folder: string
  ): Promise<{
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    const baseKey = `${folder}/${Date.now()}-${uuidv4()}`;

    // Upload original
    await this.s3.putObject({
      Bucket: this.config.bucketName,
      Key: baseKey,
      Body: file,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
      CacheControl: 'max-age=31536000',
    }).promise();

    // Generate and upload variants
    const variants = await this.generateVariants(file);
    
    await Promise.all([
      this.s3.putObject({
        Bucket: this.config.bucketName,
        Key: `${baseKey}_thumb`,
        Body: variants.thumbnail,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
        CacheControl: 'max-age=31536000',
      }).promise(),
      this.s3.putObject({
        Bucket: this.config.bucketName,
        Key: `${baseKey}_medium`,
        Body: variants.medium,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
        CacheControl: 'max-age=31536000',
      }).promise(),
      this.s3.putObject({
        Bucket: this.config.bucketName,
        Key: `${baseKey}_large`,
        Body: variants.large,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
        CacheControl: 'max-age=31536000',
      }).promise(),
    ]);

    const cdnUrl = `https://${this.config.domainName}`;
    return {
      original: `${cdnUrl}/${baseKey}`,
      thumbnail: `${cdnUrl}/${baseKey}_thumb`,
      medium: `${cdnUrl}/${baseKey}_medium`,
      large: `${cdnUrl}/${baseKey}_large`,
    };
  }

  /**
   * Generate image variants (would use Sharp)
   */
  private async generateVariants(buffer: Buffer): Promise<{
    thumbnail: Buffer;
    medium: Buffer;
    large: Buffer;
  }> {
    // This would actually resize images
    // For now, return original for all
    return {
      thumbnail: buffer,
      medium: buffer,
      large: buffer,
    };
  }
}