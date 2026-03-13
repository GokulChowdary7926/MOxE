-- AlterTable (only if RecruitmentCandidate exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RecruitmentCandidate') THEN
    ALTER TABLE "RecruitmentCandidate" ADD COLUMN IF NOT EXISTS "linkedInUrl" TEXT;
    ALTER TABLE "RecruitmentCandidate" ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT;
  END IF;
END $$;
