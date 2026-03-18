-- CreateTable
CREATE TABLE "ChatTicket" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "messageId" TEXT,
    "peerId" TEXT NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "assignedToAccountId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatTicket_messageId_key" ON "ChatTicket"("messageId");

-- CreateIndex
CREATE INDEX "ChatTicket_accountId_status_idx" ON "ChatTicket"("accountId", "status");

-- CreateIndex
CREATE INDEX "ChatTicket_assignedToAccountId_idx" ON "ChatTicket"("assignedToAccountId");

-- CreateIndex
CREATE INDEX "ChatTicket_peerId_idx" ON "ChatTicket"("peerId");

-- AddForeignKey
ALTER TABLE "ChatTicket" ADD CONSTRAINT "ChatTicket_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatTicket" ADD CONSTRAINT "ChatTicket_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatTicket" ADD CONSTRAINT "ChatTicket_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatTicket" ADD CONSTRAINT "ChatTicket_assignedToAccountId_fkey" FOREIGN KEY ("assignedToAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
