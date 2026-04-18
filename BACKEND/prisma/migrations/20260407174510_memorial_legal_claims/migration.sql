-- DropIndex (IF EXISTS: index is created in a later migration 20260407203000; fresh DBs hit DROP first)
DROP INDEX IF EXISTS "Tag_taggedById_idx";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "isMemorialized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memorializedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MemorializationRequest" (
    "id" TEXT NOT NULL,
    "requesterAccountId" TEXT NOT NULL,
    "subjectUsername" VARCHAR(100) NOT NULL,
    "relationship" VARCHAR(200) NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "staffNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorializationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileClaimRequest" (
    "id" TEXT NOT NULL,
    "requesterAccountId" TEXT NOT NULL,
    "targetUsername" VARCHAR(100) NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "staffNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRequestLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "type" VARCHAR(40) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemorializationRequest_requesterAccountId_idx" ON "MemorializationRequest"("requesterAccountId");

-- CreateIndex
CREATE INDEX "MemorializationRequest_subjectUsername_idx" ON "MemorializationRequest"("subjectUsername");

-- CreateIndex
CREATE INDEX "MemorializationRequest_status_idx" ON "MemorializationRequest"("status");

-- CreateIndex
CREATE INDEX "ProfileClaimRequest_requesterAccountId_idx" ON "ProfileClaimRequest"("requesterAccountId");

-- CreateIndex
CREATE INDEX "ProfileClaimRequest_targetUsername_idx" ON "ProfileClaimRequest"("targetUsername");

-- CreateIndex
CREATE INDEX "ProfileClaimRequest_status_idx" ON "ProfileClaimRequest"("status");

-- CreateIndex
CREATE INDEX "LegalRequestLog_accountId_idx" ON "LegalRequestLog"("accountId");

-- CreateIndex
CREATE INDEX "LegalRequestLog_type_idx" ON "LegalRequestLog"("type");

-- CreateIndex
CREATE INDEX "LegalRequestLog_createdAt_idx" ON "LegalRequestLog"("createdAt");

-- AddForeignKey
ALTER TABLE "MemorializationRequest" ADD CONSTRAINT "MemorializationRequest_requesterAccountId_fkey" FOREIGN KEY ("requesterAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileClaimRequest" ADD CONSTRAINT "ProfileClaimRequest_requesterAccountId_fkey" FOREIGN KEY ("requesterAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRequestLog" ADD CONSTRAINT "LegalRequestLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
