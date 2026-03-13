-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "commentFilterSensitivity" VARCHAR(20),
ADD COLUMN     "subscriptionTierOffers" JSONB,
ADD COLUMN     "subscriptionWelcomeMessage" VARCHAR(1000);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "brandedContentBrandId" TEXT,
ADD COLUMN     "brandedContentDisclosure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "coAuthorId" TEXT,
ADD COLUMN     "isSubscriberOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriberTierKeys" JSONB;

-- AlterTable
ALTER TABLE "Reel" ADD COLUMN     "isSubscriberOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriberTierKeys" JSONB;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "isSubscriberOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriberTierKeys" JSONB;

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "shortcut" VARCHAR(32) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "category" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoResponseRule" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "trigger" VARCHAR(200),
    "message" VARCHAR(2000) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoResponseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorConnection" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCampaign" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "niche" TEXT,
    "compensationMin" DOUBLE PRECISION,
    "compensationMax" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCampaignApplication" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandCampaignApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelBonus" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "targetViews" INTEGER NOT NULL,
    "actualViews" INTEGER NOT NULL DEFAULT 0,
    "bonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingAudio" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "genre" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendingAudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageTemplate_accountId_idx" ON "MessageTemplate"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_accountId_shortcut_key" ON "MessageTemplate"("accountId", "shortcut");

-- CreateIndex
CREATE INDEX "AutoResponseRule_accountId_idx" ON "AutoResponseRule"("accountId");

-- CreateIndex
CREATE INDEX "CreatorConnection_creatorId_idx" ON "CreatorConnection"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorConnection_creatorId_peerId_key" ON "CreatorConnection"("creatorId", "peerId");

-- CreateIndex
CREATE INDEX "BrandCampaign_status_idx" ON "BrandCampaign"("status");

-- CreateIndex
CREATE INDEX "BrandCampaign_niche_idx" ON "BrandCampaign"("niche");

-- CreateIndex
CREATE INDEX "BrandCampaignApplication_creatorId_idx" ON "BrandCampaignApplication"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandCampaignApplication_campaignId_creatorId_key" ON "BrandCampaignApplication"("campaignId", "creatorId");

-- CreateIndex
CREATE INDEX "ReelBonus_creatorId_idx" ON "ReelBonus"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ReelBonus_creatorId_month_key" ON "ReelBonus"("creatorId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "TrendingAudio_externalId_key" ON "TrendingAudio"("externalId");

-- CreateIndex
CREATE INDEX "TrendingAudio_usageCount_idx" ON "TrendingAudio"("usageCount");

-- CreateIndex
CREATE INDEX "TrendingAudio_genre_idx" ON "TrendingAudio"("genre");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_coAuthorId_fkey" FOREIGN KEY ("coAuthorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoResponseRule" ADD CONSTRAINT "AutoResponseRule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorConnection" ADD CONSTRAINT "CreatorConnection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorConnection" ADD CONSTRAINT "CreatorConnection_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaignApplication" ADD CONSTRAINT "BrandCampaignApplication_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BrandCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaignApplication" ADD CONSTRAINT "BrandCampaignApplication_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelBonus" ADD CONSTRAINT "ReelBonus_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
