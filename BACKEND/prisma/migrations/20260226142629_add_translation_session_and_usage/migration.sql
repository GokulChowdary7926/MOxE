-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "hiddenWords" JSONB,
ADD COLUMN     "hiddenWordsCommentFilter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenWordsDMFilter" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TranslationSession" (
    "id" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "calleeId" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "synthesizeSpeech" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "TranslationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationUsage" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "durationSecs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranslationSession_callerId_idx" ON "TranslationSession"("callerId");

-- CreateIndex
CREATE INDEX "TranslationSession_calleeId_idx" ON "TranslationSession"("calleeId");

-- CreateIndex
CREATE INDEX "TranslationSession_status_idx" ON "TranslationSession"("status");

-- CreateIndex
CREATE INDEX "TranslationUsage_accountId_idx" ON "TranslationUsage"("accountId");

-- CreateIndex
CREATE INDEX "TranslationUsage_createdAt_idx" ON "TranslationUsage"("createdAt");

-- AddForeignKey
ALTER TABLE "TranslationSession" ADD CONSTRAINT "TranslationSession_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationSession" ADD CONSTRAINT "TranslationSession_calleeId_fkey" FOREIGN KEY ("calleeId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationUsage" ADD CONSTRAINT "TranslationUsage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
