-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('TEXT', 'MUSIC', 'VIDEO', 'POLL', 'LINK');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('ACTIVE', 'SCHEDULED', 'EXPIRED', 'DELETED');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "type" "NoteType" NOT NULL DEFAULT 'TEXT',
    "contentJson" JSONB NOT NULL,
    "appearanceJson" JSONB,
    "audienceJson" JSONB NOT NULL,
    "publishAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "NoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteLike" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotePollVote" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotePollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteAnalytics" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "uniqueImpressions" INTEGER NOT NULL DEFAULT 0,
    "hourlyBreakdown" JSONB,
    "promotionBudget" DOUBLE PRECISION,
    "promotionImpressions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_accountId_status_idx" ON "Note"("accountId", "status");

-- CreateIndex
CREATE INDEX "Note_publishAt_status_idx" ON "Note"("publishAt", "status");

-- CreateIndex
CREATE INDEX "Note_expiresAt_status_idx" ON "Note"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "NoteLike_noteId_idx" ON "NoteLike"("noteId");

-- CreateIndex
CREATE INDEX "NoteLike_accountId_idx" ON "NoteLike"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteLike_noteId_accountId_key" ON "NoteLike"("noteId", "accountId");

-- CreateIndex
CREATE INDEX "NotePollVote_noteId_idx" ON "NotePollVote"("noteId");

-- CreateIndex
CREATE INDEX "NotePollVote_accountId_idx" ON "NotePollVote"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "NotePollVote_noteId_accountId_key" ON "NotePollVote"("noteId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteAnalytics_noteId_key" ON "NoteAnalytics"("noteId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLike" ADD CONSTRAINT "NoteLike_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLike" ADD CONSTRAINT "NoteLike_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotePollVote" ADD CONSTRAINT "NotePollVote_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotePollVote" ADD CONSTRAINT "NotePollVote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteAnalytics" ADD CONSTRAINT "NoteAnalytics_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
