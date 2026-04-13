-- CreateTable
CREATE TABLE "UploadedAsset" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadedAsset_storageKey_key" ON "UploadedAsset"("storageKey");

-- CreateIndex
CREATE INDEX "UploadedAsset_accountId_createdAt_idx" ON "UploadedAsset"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "UploadedAsset" ADD CONSTRAINT "UploadedAsset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
