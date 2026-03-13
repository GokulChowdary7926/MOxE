-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "nearbyPostCountToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nearbyPostResetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NearbyPostCharge" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NearbyPostCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NearbyPostCharge_accountId_idx" ON "NearbyPostCharge"("accountId");

-- CreateIndex
CREATE INDEX "NearbyPostCharge_createdAt_idx" ON "NearbyPostCharge"("createdAt");

-- AddForeignKey
ALTER TABLE "NearbyPostCharge" ADD CONSTRAINT "NearbyPostCharge_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
