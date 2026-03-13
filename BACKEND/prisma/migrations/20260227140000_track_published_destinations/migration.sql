-- AlterTable JobPosting: persist publish destinations (stub for external boards)
ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "publishedDestinations" JSONB;
