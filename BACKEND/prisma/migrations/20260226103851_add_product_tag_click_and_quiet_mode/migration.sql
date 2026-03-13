-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "quietModeDays" JSONB,
ADD COLUMN     "quietModeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quietModeEnd" VARCHAR(5),
ADD COLUMN     "quietModeStart" VARCHAR(5);

-- CreateTable
CREATE TABLE "ProductTagClick" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "postId" TEXT,
    "storyId" TEXT,
    "reelId" TEXT,
    "viewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductTagClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductTagClick_productId_idx" ON "ProductTagClick"("productId");

-- CreateIndex
CREATE INDEX "ProductTagClick_viewerId_idx" ON "ProductTagClick"("viewerId");

-- CreateIndex
CREATE INDEX "ProductTagClick_createdAt_idx" ON "ProductTagClick"("createdAt");
