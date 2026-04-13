-- CreateIndex
CREATE INDEX "ReelView_accountId_viewedAt_idx" ON "ReelView"("accountId", "viewedAt");

-- CreateIndex
CREATE INDEX "View_accountId_viewedAt_idx" ON "View"("accountId", "viewedAt");
