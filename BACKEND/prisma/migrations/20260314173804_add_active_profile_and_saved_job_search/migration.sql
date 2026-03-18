-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "activeProfile" VARCHAR(20) DEFAULT 'personal';

-- CreateTable
CREATE TABLE "SavedJobSearch" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT,
    "location" TEXT,
    "locationType" TEXT,
    "jobType" TEXT,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJobSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedJobSearch_accountId_idx" ON "SavedJobSearch"("accountId");

-- AddForeignKey
ALTER TABLE "SavedJobSearch" ADD CONSTRAINT "SavedJobSearch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
