-- CreateTable
CREATE TABLE "OrgAuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorAccountId" TEXT NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "summary" VARCHAR(500),
    "targetType" VARCHAR(80),
    "targetId" VARCHAR(80),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgAuditLog_orgId_createdAt_idx" ON "OrgAuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "OrgAuditLog_actorAccountId_idx" ON "OrgAuditLog"("actorAccountId");

-- AddForeignKey
ALTER TABLE "OrgAuditLog" ADD CONSTRAINT "OrgAuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAuditLog" ADD CONSTRAINT "OrgAuditLog_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
