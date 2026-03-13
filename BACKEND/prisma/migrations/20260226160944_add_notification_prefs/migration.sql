-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "notificationPrefs" JSONB;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "discountAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "reportedStoryId" TEXT;

-- CreateTable
CREATE TABLE "SellerCoupon" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "minOrder" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerCoupon_sellerId_idx" ON "SellerCoupon"("sellerId");

-- CreateIndex
CREATE INDEX "SellerCoupon_expiresAt_idx" ON "SellerCoupon"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerCoupon_sellerId_code_key" ON "SellerCoupon"("sellerId", "code");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedStoryId_fkey" FOREIGN KEY ("reportedStoryId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerCoupon" ADD CONSTRAINT "SellerCoupon_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
