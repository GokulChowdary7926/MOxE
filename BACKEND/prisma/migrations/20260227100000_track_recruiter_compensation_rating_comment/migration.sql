-- AlterTable (only if tables exist; some may be missing in early migration order)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'JobPosting') THEN
    ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "bonusPercent" DOUBLE PRECISION;
    ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "equityEligible" BOOLEAN DEFAULT false;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'JobApplication') THEN
    ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "ratingComment" TEXT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RecruitmentCandidate') THEN
    ALTER TABLE "RecruitmentCandidate" ADD COLUMN IF NOT EXISTS "ratingComment" TEXT;
  END IF;
END $$;
