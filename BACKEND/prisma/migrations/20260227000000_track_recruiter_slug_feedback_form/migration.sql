-- AlterTable JobPosting: add slug (URL-friendly), unique when set. Multiple NULLs allowed in PostgreSQL.
ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "JobPosting_slug_key" ON "JobPosting"("slug");
CREATE INDEX IF NOT EXISTS "JobPosting_slug_idx" ON "JobPosting"("slug");

-- AlterTable Interview: add feedback form type (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Interview') THEN
    ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "feedbackFormType" TEXT;
  END IF;
END $$;
