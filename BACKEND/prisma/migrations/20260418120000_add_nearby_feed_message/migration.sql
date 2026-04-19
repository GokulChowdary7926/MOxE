-- CreateTable
CREATE TABLE "NearbyFeedMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NearbyFeedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NearbyFeedMessage_messageId_key" ON "NearbyFeedMessage"("messageId");

-- CreateIndex
CREATE INDEX "NearbyFeedMessage_createdAt_idx" ON "NearbyFeedMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "NearbyFeedMessage" ADD CONSTRAINT "NearbyFeedMessage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
