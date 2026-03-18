-- CreateTable
CREATE TABLE "UserEmbedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "topics" JSONB NOT NULL,
    "professionalIntent" JSONB,
    "creatorStyle" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFeatures" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" VARCHAR(20) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "topics" JSONB NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "viralityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "recencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toolSpecific" JSONB,

    CONSTRAINT "ContentFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEmbedding_userId_key" ON "UserEmbedding"("userId");

-- CreateIndex
CREATE INDEX "ContentFeatures_contentType_engagementScore_idx" ON "ContentFeatures"("contentType", "engagementScore");

-- CreateIndex
CREATE INDEX "ContentFeatures_contentType_viralityScore_idx" ON "ContentFeatures"("contentType", "viralityScore");

-- CreateIndex
CREATE INDEX "ContentFeatures_contentType_recencyScore_idx" ON "ContentFeatures"("contentType", "recencyScore");

-- CreateIndex
CREATE UNIQUE INDEX "ContentFeatures_contentId_contentType_key" ON "ContentFeatures"("contentId", "contentType");

-- AddForeignKey
ALTER TABLE "UserEmbedding" ADD CONSTRAINT "UserEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
