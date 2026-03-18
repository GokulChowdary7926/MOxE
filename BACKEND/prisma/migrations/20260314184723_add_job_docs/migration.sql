-- CreateTable
CREATE TABLE "JobDocument" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDocumentComment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDocumentComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobDocument_accountId_idx" ON "JobDocument"("accountId");

-- CreateIndex
CREATE INDEX "JobDocumentVersion_documentId_idx" ON "JobDocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "JobDocumentComment_documentId_idx" ON "JobDocumentComment"("documentId");

-- CreateIndex
CREATE INDEX "JobDocumentComment_accountId_idx" ON "JobDocumentComment"("accountId");

-- CreateIndex
CREATE INDEX "JobDocumentComment_parentId_idx" ON "JobDocumentComment"("parentId");

-- AddForeignKey
ALTER TABLE "JobDocument" ADD CONSTRAINT "JobDocument_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDocumentVersion" ADD CONSTRAINT "JobDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "JobDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDocumentVersion" ADD CONSTRAINT "JobDocumentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDocumentComment" ADD CONSTRAINT "JobDocumentComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "JobDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDocumentComment" ADD CONSTRAINT "JobDocumentComment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDocumentComment" ADD CONSTRAINT "JobDocumentComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "JobDocumentComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
