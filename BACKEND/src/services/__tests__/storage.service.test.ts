import { isS3Configured } from '../storage.service';

describe('storage.service', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_REGION;
    delete process.env.AWS_S3_USE_EC2_ROLE;
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('isS3Configured returns false when required env vars missing', () => {
    expect(isS3Configured()).toBe(false);
  });

  it('isS3Configured returns true when all required env vars exist', () => {
    process.env.AWS_ACCESS_KEY_ID = 'key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.AWS_S3_BUCKET = 'bucket';
    process.env.AWS_REGION = 'ap-south-1';
    expect(isS3Configured()).toBe(true);
  });

  it('isS3Configured returns true with bucket, region, and AWS_S3_USE_EC2_ROLE=1', () => {
    process.env.AWS_S3_BUCKET = 'bucket';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_USE_EC2_ROLE = '1';
    expect(isS3Configured()).toBe(true);
  });
});
