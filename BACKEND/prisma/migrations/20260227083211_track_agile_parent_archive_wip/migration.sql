-- AlterTable
ALTER TABLE "TrackBoardColumn" ADD COLUMN     "wipLimit" INTEGER;

-- AlterTable
ALTER TABLE "TrackIssue" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "parentIssueId" TEXT;

-- CreateIndex
CREATE INDEX "TrackIssue_parentIssueId_idx" ON "TrackIssue"("parentIssueId");

-- CreateIndex
CREATE INDEX "TrackIssue_archivedAt_idx" ON "TrackIssue"("archivedAt");

-- AddForeignKey
ALTER TABLE "TrackIssue" ADD CONSTRAINT "TrackIssue_parentIssueId_fkey" FOREIGN KEY ("parentIssueId") REFERENCES "TrackIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
