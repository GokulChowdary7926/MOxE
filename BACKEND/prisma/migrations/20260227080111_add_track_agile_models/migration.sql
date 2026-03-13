-- CreateTable
CREATE TABLE "TrackProject" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'KANBAN',
    "leadAccountId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackBoardColumn" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackBoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackIssue" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL DEFAULT 'TASK',
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "storyPoints" INTEGER,
    "sprintId" TEXT,
    "columnId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "rank" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackSprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "goal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'FUTURE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackSprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackLabel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6B7280',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackIssueLabel" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "TrackIssueLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackAttachment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackProject_accountId_idx" ON "TrackProject"("accountId");

-- CreateIndex
CREATE INDEX "TrackProject_leadAccountId_idx" ON "TrackProject"("leadAccountId");

-- CreateIndex
CREATE INDEX "TrackProjectMember_projectId_idx" ON "TrackProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "TrackProjectMember_accountId_idx" ON "TrackProjectMember"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackProjectMember_projectId_accountId_key" ON "TrackProjectMember"("projectId", "accountId");

-- CreateIndex
CREATE INDEX "TrackBoardColumn_projectId_idx" ON "TrackBoardColumn"("projectId");

-- CreateIndex
CREATE INDEX "TrackIssue_projectId_idx" ON "TrackIssue"("projectId");

-- CreateIndex
CREATE INDEX "TrackIssue_assigneeId_idx" ON "TrackIssue"("assigneeId");

-- CreateIndex
CREATE INDEX "TrackIssue_sprintId_idx" ON "TrackIssue"("sprintId");

-- CreateIndex
CREATE INDEX "TrackIssue_columnId_idx" ON "TrackIssue"("columnId");

-- CreateIndex
CREATE INDEX "TrackSprint_projectId_idx" ON "TrackSprint"("projectId");

-- CreateIndex
CREATE INDEX "TrackSprint_status_idx" ON "TrackSprint"("status");

-- CreateIndex
CREATE INDEX "TrackLabel_projectId_idx" ON "TrackLabel"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackLabel_projectId_name_key" ON "TrackLabel"("projectId", "name");

-- CreateIndex
CREATE INDEX "TrackIssueLabel_issueId_idx" ON "TrackIssueLabel"("issueId");

-- CreateIndex
CREATE INDEX "TrackIssueLabel_labelId_idx" ON "TrackIssueLabel"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackIssueLabel_issueId_labelId_key" ON "TrackIssueLabel"("issueId", "labelId");

-- CreateIndex
CREATE INDEX "TrackAttachment_issueId_idx" ON "TrackAttachment"("issueId");

-- AddForeignKey
ALTER TABLE "TrackProject" ADD CONSTRAINT "TrackProject_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackProject" ADD CONSTRAINT "TrackProject_leadAccountId_fkey" FOREIGN KEY ("leadAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackProjectMember" ADD CONSTRAINT "TrackProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TrackProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackProjectMember" ADD CONSTRAINT "TrackProjectMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackBoardColumn" ADD CONSTRAINT "TrackBoardColumn_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TrackProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackIssue" ADD CONSTRAINT "TrackIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TrackProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackIssue" ADD CONSTRAINT "TrackIssue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackIssue" ADD CONSTRAINT "TrackIssue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackIssue" ADD CONSTRAINT "TrackIssue_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "TrackBoardColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackIssue" ADD CONSTRAINT "TrackIssue_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "TrackSprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackSprint" ADD CONSTRAINT "TrackSprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TrackProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLabel" ADD CONSTRAINT "TrackLabel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TrackProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackIssueLabel" ADD CONSTRAINT "TrackIssueLabel_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "TrackIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackIssueLabel" ADD CONSTRAINT "TrackIssueLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "TrackLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackAttachment" ADD CONSTRAINT "TrackAttachment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "TrackIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackAttachment" ADD CONSTRAINT "TrackAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
