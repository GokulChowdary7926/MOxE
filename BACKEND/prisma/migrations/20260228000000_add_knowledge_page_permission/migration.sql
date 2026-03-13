-- CreateTable (only if KnowledgePage exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'KnowledgePage') THEN
    CREATE TABLE "KnowledgePagePermission" (
      "id" TEXT NOT NULL,
      "pageId" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "role" VARCHAR(20) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "KnowledgePagePermission_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "KnowledgePagePermission_pageId_accountId_key" ON "KnowledgePagePermission"("pageId", "accountId");
    CREATE INDEX "KnowledgePagePermission_pageId_idx" ON "KnowledgePagePermission"("pageId");
    CREATE INDEX "KnowledgePagePermission_accountId_idx" ON "KnowledgePagePermission"("accountId");
    ALTER TABLE "KnowledgePagePermission" ADD CONSTRAINT "KnowledgePagePermission_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "KnowledgePagePermission" ADD CONSTRAINT "KnowledgePagePermission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
