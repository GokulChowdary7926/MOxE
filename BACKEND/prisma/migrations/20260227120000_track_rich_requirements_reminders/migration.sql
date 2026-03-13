-- AlterTable JobPosting: descriptionFormat, requirementsStructured
ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "descriptionFormat" TEXT;
ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "requirementsStructured" JSONB;

-- AlterTable Interview: reminderHoursBefore (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Interview') THEN
    ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "reminderHoursBefore" JSONB;
  END IF;
END $$;
