-- CreateTable Offer (MOxE TRACK Recruiter – Offer management)
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT,
    "recruitmentCandidateId" TEXT,
    "jobPostingId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "compensationSummary" TEXT,
    "proposedStartDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Offer_jobApplicationId_idx" ON "Offer"("jobApplicationId");
CREATE INDEX "Offer_recruitmentCandidateId_idx" ON "Offer"("recruitmentCandidateId");
CREATE INDEX "Offer_jobPostingId_idx" ON "Offer"("jobPostingId");
CREATE INDEX "Offer_createdById_idx" ON "Offer"("createdById");
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- Foreign keys (skip recruitmentCandidateId if RecruitmentCandidate table does not exist)
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RecruitmentCandidate') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_recruitmentCandidateId_fkey" FOREIGN KEY ("recruitmentCandidateId") REFERENCES "RecruitmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
