-- CreateTable
CREATE TABLE "content_analytics" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "plays_source" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reel_retention" (
    "id" TEXT NOT NULL,
    "reel_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "second" INTEGER NOT NULL,
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reel_retention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "budget" INTEGER NOT NULL,
    "compensation" INTEGER NOT NULL,
    "requirements" JSONB,
    "category" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_analytics_owner_id_idx" ON "content_analytics"("owner_id");

-- CreateIndex
CREATE INDEX "content_analytics_content_type_idx" ON "content_analytics"("content_type");

-- CreateIndex
CREATE UNIQUE INDEX "content_analytics_content_id_content_type_key" ON "content_analytics"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "reel_retention_owner_id_reel_id_idx" ON "reel_retention"("owner_id", "reel_id");

-- CreateIndex
CREATE UNIQUE INDEX "reel_retention_reel_id_second_key" ON "reel_retention"("reel_id", "second");

-- CreateIndex
CREATE INDEX "campaigns_brand_id_status_idx" ON "campaigns"("brand_id", "status");

-- CreateIndex
CREATE INDEX "applications_creator_id_status_idx" ON "applications"("creator_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_campaign_id_creator_id_key" ON "applications"("campaign_id", "creator_id");

-- AddForeignKey
ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
