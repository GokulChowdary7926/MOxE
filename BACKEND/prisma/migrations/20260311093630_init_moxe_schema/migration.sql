/*
  Warnings:

  - You are about to alter the column `name` on the `FlowBoard` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `FlowBoard` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `title` on the `FlowCard` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `companyName` on the `FlowCard` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `jobPostingUrl` on the `FlowCard` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `name` on the `FlowColumn` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(120)`.

*/
-- DropForeignKey
ALTER TABLE "FlowBoard" DROP CONSTRAINT "FlowBoard_accountId_fkey";

-- DropForeignKey
ALTER TABLE "FlowCard" DROP CONSTRAINT "FlowCard_columnId_fkey";

-- DropForeignKey
ALTER TABLE "FlowColumn" DROP CONSTRAINT "FlowColumn_boardId_fkey";

-- AlterTable
ALTER TABLE "FlowBoard" ADD COLUMN     "background" VARCHAR(120),
ADD COLUMN     "boardType" VARCHAR(20) NOT NULL DEFAULT 'PERSONAL',
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "FlowCard" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "companyName" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "jobPostingUrl" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "FlowColumn" ADD COLUMN     "color" VARCHAR(30),
ADD COLUMN     "wipLimit" INTEGER,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(120);

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "decidedById" TEXT,
ADD COLUMN     "decision" TEXT,
ADD COLUMN     "decisionReason" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "department" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "hiringManagerId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "recruiterId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(5000),
    "url" VARCHAR(500) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentCandidate" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "currentCompany" TEXT,
    "currentTitle" TEXT,
    "resumeUrl" TEXT,
    "linkedInUrl" TEXT,
    "portfolioUrl" TEXT,
    "coverLetter" TEXT,
    "source" TEXT,
    "pipelineStageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ADDED',
    "rating" INTEGER,
    "ratingComment" TEXT,
    "notes" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT,
    "recruitmentCandidateId" TEXT,
    "type" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "locationOrLink" TEXT,
    "feedbackFormType" TEXT,
    "reminderHoursBefore" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewInterviewer" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewInterviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "rating" INTEGER,
    "recommendation" TEXT,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkProject" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "projectType" TEXT NOT NULL DEFAULT 'INTERNAL',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budgetAmount" DOUBLE PRECISION,
    "budgetCurrency" TEXT DEFAULT 'USD',
    "budgetBreakdown" JSONB,
    "goals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTaskList" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTaskList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTask" (
    "id" TEXT NOT NULL,
    "taskListId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'TO_DO',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "durationDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkTaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTaskDependency" (
    "id" TEXT NOT NULL,
    "predecessorId" TEXT NOT NULL,
    "successorId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'FINISH_TO_START',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkTaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkTaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTaskAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkTaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertSchedule" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "rotationType" VARCHAR(20) NOT NULL,
    "handoffDay" INTEGER,
    "handoffTime" VARCHAR(5) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertScheduleParticipant" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isSecondary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertScheduleParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "condition" JSONB NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "escalationConfig" JSONB,
    "notificationMethods" JSONB,
    "quietHoursConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertDelivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSpace" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "type" VARCHAR(20) NOT NULL DEFAULT 'TEAM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSpacePermission" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSpacePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeLabel" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#6B7280',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePage" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(250) NOT NULL,
    "content" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KnowledgePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePagePermission" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePagePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePageVersion" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePageLabel" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePageLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePageComment" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgePageComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePageAttachment" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "fileUrl" VARCHAR(1000) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowBoardMember" (
    "boardId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowBoardMember_pkey" PRIMARY KEY ("boardId","accountId")
);

-- CreateTable
CREATE TABLE "FlowBoardInvite" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowBoardInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowLabel" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "color" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowCardLabel" (
    "cardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "FlowCardLabel_pkey" PRIMARY KEY ("cardId","labelId")
);

-- CreateTable
CREATE TABLE "FlowCardMember" (
    "cardId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "FlowCardMember_pkey" PRIMARY KEY ("cardId","accountId")
);

-- CreateTable
CREATE TABLE "FlowChecklist" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowComment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowAttachment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileUrl" VARCHAR(1024) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100),
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowCardReminder" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "notifyAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowCardReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "domain" VARCHAR(253),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgDepartment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgRole" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgGroup" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUser" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "displayName" VARCHAR(200),
    "departmentId" TEXT,
    "roleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUserGroup" (
    "orgUserId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "OrgUserGroup_pkey" PRIMARY KEY ("orgUserId","groupId")
);

-- CreateTable
CREATE TABLE "OrgInvitation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "invitedForId" TEXT,

    CONSTRAINT "OrgInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgSsoConfig" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "protocol" VARCHAR(10) NOT NULL,
    "metadataXml" TEXT,
    "entityId" VARCHAR(500),
    "ssoUrl" VARCHAR(500),
    "logoutUrl" VARCHAR(500),
    "certificate" TEXT,
    "domains" JSONB,
    "enforcementLevel" VARCHAR(30) NOT NULL DEFAULT 'optional',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" VARCHAR(20),
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSsoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMfaPolicy" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "methods" JSONB NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 14,
    "enforcementLevel" VARCHAR(30) NOT NULL DEFAULT 'optional',
    "exclusions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgMfaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMfaEnrollment" (
    "id" TEXT NOT NULL,
    "orgUserId" TEXT NOT NULL,
    "method" VARCHAR(30) NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "OrgMfaEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeRepository" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    "defaultBranch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeRepoCollaborator" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeRepoCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeBranch" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "headCommitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeCommit" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "parentCommitId" TEXT,
    "message" VARCHAR(500) NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeCommitFile" (
    "id" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeCommitFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeRepoLabel" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeRepoLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodePullRequest" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "sourceBranchId" TEXT NOT NULL,
    "targetBranchId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "authorId" TEXT NOT NULL,
    "mergedAt" TIMESTAMP(3),
    "mergedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodePullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodePRReviewer" (
    "id" TEXT NOT NULL,
    "prId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodePRReviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodePRComment" (
    "id" TEXT NOT NULL,
    "prId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "path" VARCHAR(500),
    "lineNumber" INTEGER,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodePRComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodePRLabel" (
    "prId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "CodePRLabel_pkey" PRIMARY KEY ("prId","labelId")
);

-- CreateTable
CREATE TABLE "CodePRLinkedIssue" (
    "id" TEXT NOT NULL,
    "prId" TEXT NOT NULL,
    "issueRef" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodePRLinkedIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAIAudit" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "metadata" JSONB,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAIAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildPipeline" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "branchFilter" VARCHAR(200) NOT NULL,
    "triggers" JSONB NOT NULL,
    "stages" JSONB NOT NULL,
    "externalKey" VARCHAR(120),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildRun" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "externalRunId" VARCHAR(120),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "triggerType" VARCHAR(20) NOT NULL,
    "commitSha" VARCHAR(64),
    "branch" VARCHAR(255),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "logsUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobStrategyPlan" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "horizon" VARCHAR(30) NOT NULL,
    "timeframe" VARCHAR(120),
    "focusAreas" JSONB,
    "summary" VARCHAR(2000),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobStrategyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobIntegration" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    "displayName" VARCHAR(100) NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTeam" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT,

    CONSTRAINT "JobTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPage" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "customDomain" VARCHAR(255),
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageComponent" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "type" VARCHAR(30) NOT NULL DEFAULT 'API',
    "status" VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPageComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusIncident" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'INVESTIGATING',
    "authorId" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusIncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusIncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusIncidentComponent" (
    "incidentId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,

    CONSTRAINT "StatusIncidentComponent_pkey" PRIMARY KEY ("incidentId","componentId")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "descriptionMd" VARCHAR(2000),
    "docLink" VARCHAR(500),
    "apiBaseUrl" VARCHAR(500),
    "healthCheckUrl" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    "environment" VARCHAR(20) NOT NULL DEFAULT 'production',
    "tags" JSONB,
    "notes" VARCHAR(1000),
    "healthConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAlertAt" TIMESTAMP(3),
    "openAlertEventId" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOwner" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" VARCHAR(30) NOT NULL DEFAULT 'PRIMARY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDependency" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "kind" VARCHAR(30) NOT NULL DEFAULT 'REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHealthCheck" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "error" VARCHAR(500),

    CONSTRAINT "ServiceHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasObjective" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "periodType" VARCHAR(20) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "state" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "parentId" TEXT,
    "linkedProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtlasObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasKeyResult" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "unit" VARCHAR(50),
    "targetValue" DOUBLE PRECISION,
    "startValue" DOUBLE PRECISION DEFAULT 0,
    "currentValue" DOUBLE PRECISION DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtlasKeyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasProgressUpdate" (
    "id" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "note" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtlasProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasKeyResultIssueLink" (
    "id" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,

    CONSTRAINT "AtlasKeyResultIssueLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDocLink" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "docType" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200),
    "preview" VARCHAR(500),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceDocLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaExpiration" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "deleteAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaExpiration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "postId" TEXT,
    "name" VARCHAR(200) NOT NULL,
    "objective" VARCHAR(50) NOT NULL DEFAULT 'AWARENESS',
    "type" VARCHAR(20) NOT NULL DEFAULT 'BOOST',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "dailyBudget" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bidCpm" DOUBLE PRECISION,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaignInsight" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCampaignInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdAudience" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "definition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaignAudience" (
    "campaignId" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,

    CONSTRAINT "AdCampaignAudience_pkey" PRIMARY KEY ("campaignId","audienceId")
);

-- CreateTable
CREATE TABLE "AdBillingAccount" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "creditBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlySpendLimit" DOUBLE PRECISION,
    "hardLimit" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdBillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdInvoice" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "AdInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCreditTransaction" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdFraudSignal" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "advertiserAccountId" TEXT NOT NULL,
    "viewerAccountId" TEXT,
    "ip" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "eventType" VARCHAR(20) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdFraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdFraudBlock" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "advertiserAccountId" TEXT,
    "level" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AdFraudBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_accountId_createdAt_idx" ON "Video"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitmentCandidate_jobPostingId_idx" ON "RecruitmentCandidate"("jobPostingId");

-- CreateIndex
CREATE INDEX "RecruitmentCandidate_addedById_idx" ON "RecruitmentCandidate"("addedById");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentCandidate_jobPostingId_email_key" ON "RecruitmentCandidate"("jobPostingId", "email");

-- CreateIndex
CREATE INDEX "Interview_jobApplicationId_idx" ON "Interview"("jobApplicationId");

-- CreateIndex
CREATE INDEX "Interview_recruitmentCandidateId_idx" ON "Interview"("recruitmentCandidateId");

-- CreateIndex
CREATE INDEX "Interview_createdById_idx" ON "Interview"("createdById");

-- CreateIndex
CREATE INDEX "InterviewInterviewer_interviewId_idx" ON "InterviewInterviewer"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewInterviewer_accountId_idx" ON "InterviewInterviewer"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewInterviewer_interviewId_accountId_key" ON "InterviewInterviewer"("interviewId", "accountId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_interviewId_idx" ON "InterviewFeedback"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_accountId_idx" ON "InterviewFeedback"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewFeedback_interviewId_accountId_key" ON "InterviewFeedback"("interviewId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkProject_slug_key" ON "WorkProject"("slug");

-- CreateIndex
CREATE INDEX "WorkProject_accountId_idx" ON "WorkProject"("accountId");

-- CreateIndex
CREATE INDEX "WorkProject_slug_idx" ON "WorkProject"("slug");

-- CreateIndex
CREATE INDEX "WorkProjectMember_projectId_idx" ON "WorkProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "WorkProjectMember_accountId_idx" ON "WorkProjectMember"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkProjectMember_projectId_accountId_key" ON "WorkProjectMember"("projectId", "accountId");

-- CreateIndex
CREATE INDEX "WorkTaskList_projectId_idx" ON "WorkTaskList"("projectId");

-- CreateIndex
CREATE INDEX "WorkTask_taskListId_idx" ON "WorkTask"("taskListId");

-- CreateIndex
CREATE INDEX "WorkTask_assignedToId_idx" ON "WorkTask"("assignedToId");

-- CreateIndex
CREATE INDEX "WorkTask_status_idx" ON "WorkTask"("status");

-- CreateIndex
CREATE INDEX "WorkTaskChecklistItem_taskId_idx" ON "WorkTaskChecklistItem"("taskId");

-- CreateIndex
CREATE INDEX "WorkTaskDependency_predecessorId_idx" ON "WorkTaskDependency"("predecessorId");

-- CreateIndex
CREATE INDEX "WorkTaskDependency_successorId_idx" ON "WorkTaskDependency"("successorId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkTaskDependency_predecessorId_successorId_key" ON "WorkTaskDependency"("predecessorId", "successorId");

-- CreateIndex
CREATE INDEX "WorkTaskComment_taskId_idx" ON "WorkTaskComment"("taskId");

-- CreateIndex
CREATE INDEX "WorkTaskComment_accountId_idx" ON "WorkTaskComment"("accountId");

-- CreateIndex
CREATE INDEX "WorkTaskAttachment_taskId_idx" ON "WorkTaskAttachment"("taskId");

-- CreateIndex
CREATE INDEX "WorkTaskAttachment_accountId_idx" ON "WorkTaskAttachment"("accountId");

-- CreateIndex
CREATE INDEX "AlertSchedule_accountId_idx" ON "AlertSchedule"("accountId");

-- CreateIndex
CREATE INDEX "AlertScheduleParticipant_scheduleId_idx" ON "AlertScheduleParticipant"("scheduleId");

-- CreateIndex
CREATE INDEX "AlertScheduleParticipant_accountId_idx" ON "AlertScheduleParticipant"("accountId");

-- CreateIndex
CREATE INDEX "AlertRule_scheduleId_idx" ON "AlertRule"("scheduleId");

-- CreateIndex
CREATE INDEX "AlertEvent_ruleId_idx" ON "AlertEvent"("ruleId");

-- CreateIndex
CREATE INDEX "AlertDelivery_eventId_idx" ON "AlertDelivery"("eventId");

-- CreateIndex
CREATE INDEX "AlertDelivery_recipientId_idx" ON "AlertDelivery"("recipientId");

-- CreateIndex
CREATE INDEX "KnowledgeSpace_accountId_idx" ON "KnowledgeSpace"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSpace_accountId_slug_key" ON "KnowledgeSpace"("accountId", "slug");

-- CreateIndex
CREATE INDEX "KnowledgeSpacePermission_spaceId_idx" ON "KnowledgeSpacePermission"("spaceId");

-- CreateIndex
CREATE INDEX "KnowledgeSpacePermission_accountId_idx" ON "KnowledgeSpacePermission"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSpacePermission_spaceId_accountId_key" ON "KnowledgeSpacePermission"("spaceId", "accountId");

-- CreateIndex
CREATE INDEX "KnowledgeLabel_spaceId_idx" ON "KnowledgeLabel"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeLabel_spaceId_name_key" ON "KnowledgeLabel"("spaceId", "name");

-- CreateIndex
CREATE INDEX "KnowledgePage_spaceId_idx" ON "KnowledgePage"("spaceId");

-- CreateIndex
CREATE INDEX "KnowledgePage_parentId_idx" ON "KnowledgePage"("parentId");

-- CreateIndex
CREATE INDEX "KnowledgePage_createdById_idx" ON "KnowledgePage"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePage_spaceId_slug_key" ON "KnowledgePage"("spaceId", "slug");

-- CreateIndex
CREATE INDEX "KnowledgePagePermission_pageId_idx" ON "KnowledgePagePermission"("pageId");

-- CreateIndex
CREATE INDEX "KnowledgePagePermission_accountId_idx" ON "KnowledgePagePermission"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePagePermission_pageId_accountId_key" ON "KnowledgePagePermission"("pageId", "accountId");

-- CreateIndex
CREATE INDEX "KnowledgePageVersion_pageId_idx" ON "KnowledgePageVersion"("pageId");

-- CreateIndex
CREATE INDEX "KnowledgePageLabel_pageId_idx" ON "KnowledgePageLabel"("pageId");

-- CreateIndex
CREATE INDEX "KnowledgePageLabel_labelId_idx" ON "KnowledgePageLabel"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePageLabel_pageId_labelId_key" ON "KnowledgePageLabel"("pageId", "labelId");

-- CreateIndex
CREATE INDEX "KnowledgePageComment_pageId_idx" ON "KnowledgePageComment"("pageId");

-- CreateIndex
CREATE INDEX "KnowledgePageComment_accountId_idx" ON "KnowledgePageComment"("accountId");

-- CreateIndex
CREATE INDEX "KnowledgePageComment_parentId_idx" ON "KnowledgePageComment"("parentId");

-- CreateIndex
CREATE INDEX "KnowledgePageAttachment_pageId_idx" ON "KnowledgePageAttachment"("pageId");

-- CreateIndex
CREATE INDEX "FlowBoardMember_boardId_idx" ON "FlowBoardMember"("boardId");

-- CreateIndex
CREATE INDEX "FlowBoardMember_accountId_idx" ON "FlowBoardMember"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowBoardInvite_token_key" ON "FlowBoardInvite"("token");

-- CreateIndex
CREATE INDEX "FlowBoardInvite_boardId_idx" ON "FlowBoardInvite"("boardId");

-- CreateIndex
CREATE INDEX "FlowBoardInvite_email_idx" ON "FlowBoardInvite"("email");

-- CreateIndex
CREATE INDEX "FlowBoardInvite_token_idx" ON "FlowBoardInvite"("token");

-- CreateIndex
CREATE INDEX "FlowLabel_boardId_idx" ON "FlowLabel"("boardId");

-- CreateIndex
CREATE INDEX "FlowCardLabel_cardId_idx" ON "FlowCardLabel"("cardId");

-- CreateIndex
CREATE INDEX "FlowCardLabel_labelId_idx" ON "FlowCardLabel"("labelId");

-- CreateIndex
CREATE INDEX "FlowCardMember_cardId_idx" ON "FlowCardMember"("cardId");

-- CreateIndex
CREATE INDEX "FlowCardMember_accountId_idx" ON "FlowCardMember"("accountId");

-- CreateIndex
CREATE INDEX "FlowChecklist_cardId_idx" ON "FlowChecklist"("cardId");

-- CreateIndex
CREATE INDEX "FlowChecklistItem_checklistId_idx" ON "FlowChecklistItem"("checklistId");

-- CreateIndex
CREATE INDEX "FlowComment_cardId_idx" ON "FlowComment"("cardId");

-- CreateIndex
CREATE INDEX "FlowComment_authorId_idx" ON "FlowComment"("authorId");

-- CreateIndex
CREATE INDEX "FlowAttachment_cardId_idx" ON "FlowAttachment"("cardId");

-- CreateIndex
CREATE INDEX "FlowAttachment_uploaderId_idx" ON "FlowAttachment"("uploaderId");

-- CreateIndex
CREATE INDEX "FlowCardReminder_accountId_idx" ON "FlowCardReminder"("accountId");

-- CreateIndex
CREATE INDEX "FlowCardReminder_cardId_idx" ON "FlowCardReminder"("cardId");

-- CreateIndex
CREATE INDEX "FlowCardReminder_notifyAt_idx" ON "FlowCardReminder"("notifyAt");

-- CreateIndex
CREATE UNIQUE INDEX "Org_name_key" ON "Org"("name");

-- CreateIndex
CREATE INDEX "OrgDepartment_orgId_idx" ON "OrgDepartment"("orgId");

-- CreateIndex
CREATE INDEX "OrgRole_orgId_idx" ON "OrgRole"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRole_orgId_name_key" ON "OrgRole"("orgId", "name");

-- CreateIndex
CREATE INDEX "OrgGroup_orgId_idx" ON "OrgGroup"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgGroup_orgId_name_key" ON "OrgGroup"("orgId", "name");

-- CreateIndex
CREATE INDEX "OrgUser_orgId_idx" ON "OrgUser"("orgId");

-- CreateIndex
CREATE INDEX "OrgUser_accountId_idx" ON "OrgUser"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUser_orgId_email_key" ON "OrgUser"("orgId", "email");

-- CreateIndex
CREATE INDEX "OrgUserGroup_groupId_idx" ON "OrgUserGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgInvitation_token_key" ON "OrgInvitation"("token");

-- CreateIndex
CREATE INDEX "OrgInvitation_orgId_idx" ON "OrgInvitation"("orgId");

-- CreateIndex
CREATE INDEX "OrgInvitation_email_idx" ON "OrgInvitation"("email");

-- CreateIndex
CREATE INDEX "OrgInvitation_expiresAt_idx" ON "OrgInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "OrgSsoConfig_orgId_idx" ON "OrgSsoConfig"("orgId");

-- CreateIndex
CREATE INDEX "OrgMfaPolicy_orgId_idx" ON "OrgMfaPolicy"("orgId");

-- CreateIndex
CREATE INDEX "OrgMfaEnrollment_orgUserId_idx" ON "OrgMfaEnrollment"("orgUserId");

-- CreateIndex
CREATE INDEX "OrgMfaEnrollment_method_idx" ON "OrgMfaEnrollment"("method");

-- CreateIndex
CREATE INDEX "CodeRepository_accountId_idx" ON "CodeRepository"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeRepository_accountId_slug_key" ON "CodeRepository"("accountId", "slug");

-- CreateIndex
CREATE INDEX "CodeRepoCollaborator_repoId_idx" ON "CodeRepoCollaborator"("repoId");

-- CreateIndex
CREATE INDEX "CodeRepoCollaborator_accountId_idx" ON "CodeRepoCollaborator"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeRepoCollaborator_repoId_accountId_key" ON "CodeRepoCollaborator"("repoId", "accountId");

-- CreateIndex
CREATE INDEX "CodeBranch_repoId_idx" ON "CodeBranch"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeBranch_repoId_name_key" ON "CodeBranch"("repoId", "name");

-- CreateIndex
CREATE INDEX "CodeCommit_repoId_idx" ON "CodeCommit"("repoId");

-- CreateIndex
CREATE INDEX "CodeCommit_branchId_idx" ON "CodeCommit"("branchId");

-- CreateIndex
CREATE INDEX "CodeCommit_authorId_idx" ON "CodeCommit"("authorId");

-- CreateIndex
CREATE INDEX "CodeCommitFile_commitId_idx" ON "CodeCommitFile"("commitId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeCommitFile_commitId_path_key" ON "CodeCommitFile"("commitId", "path");

-- CreateIndex
CREATE INDEX "CodeRepoLabel_repoId_idx" ON "CodeRepoLabel"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeRepoLabel_repoId_name_key" ON "CodeRepoLabel"("repoId", "name");

-- CreateIndex
CREATE INDEX "CodePullRequest_repoId_idx" ON "CodePullRequest"("repoId");

-- CreateIndex
CREATE INDEX "CodePullRequest_authorId_idx" ON "CodePullRequest"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "CodePullRequest_repoId_number_key" ON "CodePullRequest"("repoId", "number");

-- CreateIndex
CREATE INDEX "CodePRReviewer_prId_idx" ON "CodePRReviewer"("prId");

-- CreateIndex
CREATE INDEX "CodePRReviewer_accountId_idx" ON "CodePRReviewer"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "CodePRReviewer_prId_accountId_key" ON "CodePRReviewer"("prId", "accountId");

-- CreateIndex
CREATE INDEX "CodePRComment_prId_idx" ON "CodePRComment"("prId");

-- CreateIndex
CREATE INDEX "CodePRComment_accountId_idx" ON "CodePRComment"("accountId");

-- CreateIndex
CREATE INDEX "CodePRComment_parentId_idx" ON "CodePRComment"("parentId");

-- CreateIndex
CREATE INDEX "CodePRLabel_prId_idx" ON "CodePRLabel"("prId");

-- CreateIndex
CREATE INDEX "CodePRLabel_labelId_idx" ON "CodePRLabel"("labelId");

-- CreateIndex
CREATE INDEX "CodePRLinkedIssue_prId_idx" ON "CodePRLinkedIssue"("prId");

-- CreateIndex
CREATE UNIQUE INDEX "CodePRLinkedIssue_prId_issueRef_key" ON "CodePRLinkedIssue"("prId", "issueRef");

-- CreateIndex
CREATE INDEX "JobAIAudit_accountId_createdAt_idx" ON "JobAIAudit"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "BuildPipeline_accountId_idx" ON "BuildPipeline"("accountId");

-- CreateIndex
CREATE INDEX "BuildPipeline_repoId_idx" ON "BuildPipeline"("repoId");

-- CreateIndex
CREATE INDEX "BuildRun_pipelineId_idx" ON "BuildRun"("pipelineId");

-- CreateIndex
CREATE INDEX "BuildRun_status_idx" ON "BuildRun"("status");

-- CreateIndex
CREATE INDEX "JobStrategyPlan_accountId_createdAt_idx" ON "JobStrategyPlan"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "JobIntegration_accountId_provider_idx" ON "JobIntegration"("accountId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "JobIntegration_accountId_provider_key" ON "JobIntegration"("accountId", "provider");

-- CreateIndex
CREATE INDEX "JobTeam_accountId_idx" ON "JobTeam"("accountId");

-- CreateIndex
CREATE INDEX "JobTeam_memberId_idx" ON "JobTeam"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "JobTeam_accountId_memberId_key" ON "JobTeam"("accountId", "memberId");

-- CreateIndex
CREATE INDEX "StatusPage_accountId_idx" ON "StatusPage"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPage_accountId_slug_key" ON "StatusPage"("accountId", "slug");

-- CreateIndex
CREATE INDEX "StatusPageComponent_pageId_idx" ON "StatusPageComponent"("pageId");

-- CreateIndex
CREATE INDEX "StatusIncident_pageId_idx" ON "StatusIncident"("pageId");

-- CreateIndex
CREATE INDEX "StatusIncident_authorId_idx" ON "StatusIncident"("authorId");

-- CreateIndex
CREATE INDEX "StatusIncident_status_idx" ON "StatusIncident"("status");

-- CreateIndex
CREATE INDEX "StatusIncidentUpdate_incidentId_idx" ON "StatusIncidentUpdate"("incidentId");

-- CreateIndex
CREATE INDEX "StatusIncidentUpdate_authorId_idx" ON "StatusIncidentUpdate"("authorId");

-- CreateIndex
CREATE INDEX "StatusIncidentComponent_incidentId_idx" ON "StatusIncidentComponent"("incidentId");

-- CreateIndex
CREATE INDEX "StatusIncidentComponent_componentId_idx" ON "StatusIncidentComponent"("componentId");

-- CreateIndex
CREATE INDEX "Service_accountId_idx" ON "Service"("accountId");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Service_accountId_slug_key" ON "Service"("accountId", "slug");

-- CreateIndex
CREATE INDEX "ServiceOwner_serviceId_idx" ON "ServiceOwner"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceOwner_accountId_idx" ON "ServiceOwner"("accountId");

-- CreateIndex
CREATE INDEX "ServiceDependency_serviceId_idx" ON "ServiceDependency"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceDependency_dependsOnId_idx" ON "ServiceDependency"("dependsOnId");

-- CreateIndex
CREATE INDEX "ServiceHealthCheck_serviceId_idx" ON "ServiceHealthCheck"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceHealthCheck_checkedAt_idx" ON "ServiceHealthCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "ServiceHealthCheck_status_idx" ON "ServiceHealthCheck"("status");

-- CreateIndex
CREATE INDEX "AtlasObjective_accountId_idx" ON "AtlasObjective"("accountId");

-- CreateIndex
CREATE INDEX "AtlasObjective_parentId_idx" ON "AtlasObjective"("parentId");

-- CreateIndex
CREATE INDEX "AtlasKeyResult_objectiveId_idx" ON "AtlasKeyResult"("objectiveId");

-- CreateIndex
CREATE INDEX "AtlasProgressUpdate_keyResultId_idx" ON "AtlasProgressUpdate"("keyResultId");

-- CreateIndex
CREATE INDEX "AtlasProgressUpdate_accountId_idx" ON "AtlasProgressUpdate"("accountId");

-- CreateIndex
CREATE INDEX "AtlasKeyResultIssueLink_issueId_idx" ON "AtlasKeyResultIssueLink"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "AtlasKeyResultIssueLink_keyResultId_issueId_key" ON "AtlasKeyResultIssueLink"("keyResultId", "issueId");

-- CreateIndex
CREATE INDEX "ServiceDocLink_serviceId_idx" ON "ServiceDocLink"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceDocLink_pageId_idx" ON "ServiceDocLink"("pageId");

-- CreateIndex
CREATE INDEX "MediaExpiration_deleteAt_idx" ON "MediaExpiration"("deleteAt");

-- CreateIndex
CREATE INDEX "AdCampaign_accountId_idx" ON "AdCampaign"("accountId");

-- CreateIndex
CREATE INDEX "AdCampaign_postId_idx" ON "AdCampaign"("postId");

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaignInsight_campaignId_idx" ON "AdCampaignInsight"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "AdCampaignInsight_campaignId_date_key" ON "AdCampaignInsight"("campaignId", "date");

-- CreateIndex
CREATE INDEX "AdAudience_accountId_idx" ON "AdAudience"("accountId");

-- CreateIndex
CREATE INDEX "AdCampaignAudience_campaignId_idx" ON "AdCampaignAudience"("campaignId");

-- CreateIndex
CREATE INDEX "AdCampaignAudience_audienceId_idx" ON "AdCampaignAudience"("audienceId");

-- CreateIndex
CREATE UNIQUE INDEX "AdBillingAccount_accountId_key" ON "AdBillingAccount"("accountId");

-- CreateIndex
CREATE INDEX "AdBillingAccount_accountId_idx" ON "AdBillingAccount"("accountId");

-- CreateIndex
CREATE INDEX "AdInvoice_billingAccountId_idx" ON "AdInvoice"("billingAccountId");

-- CreateIndex
CREATE INDEX "AdInvoice_status_idx" ON "AdInvoice"("status");

-- CreateIndex
CREATE INDEX "AdCreditTransaction_billingAccountId_idx" ON "AdCreditTransaction"("billingAccountId");

-- CreateIndex
CREATE INDEX "AdCreditTransaction_invoiceId_idx" ON "AdCreditTransaction"("invoiceId");

-- CreateIndex
CREATE INDEX "AdFraudSignal_campaignId_idx" ON "AdFraudSignal"("campaignId");

-- CreateIndex
CREATE INDEX "AdFraudSignal_advertiserAccountId_idx" ON "AdFraudSignal"("advertiserAccountId");

-- CreateIndex
CREATE INDEX "AdFraudSignal_viewerAccountId_idx" ON "AdFraudSignal"("viewerAccountId");

-- CreateIndex
CREATE INDEX "AdFraudSignal_ip_idx" ON "AdFraudSignal"("ip");

-- CreateIndex
CREATE INDEX "AdFraudBlock_campaignId_idx" ON "AdFraudBlock"("campaignId");

-- CreateIndex
CREATE INDEX "AdFraudBlock_advertiserAccountId_idx" ON "AdFraudBlock"("advertiserAccountId");

-- CreateIndex
CREATE INDEX "AdFraudBlock_active_expiresAt_idx" ON "AdFraudBlock"("active", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdFraudBlock_campaignId_advertiserAccountId_level_key" ON "AdFraudBlock"("campaignId", "advertiserAccountId", "level");

-- CreateIndex
CREATE INDEX "FlowCard_dueDate_idx" ON "FlowCard"("dueDate");

-- CreateIndex
CREATE INDEX "FlowCard_archivedAt_idx" ON "FlowCard"("archivedAt");

-- CreateIndex
CREATE INDEX "JobPosting_hiringManagerId_idx" ON "JobPosting"("hiringManagerId");

-- CreateIndex
CREATE INDEX "JobPosting_recruiterId_idx" ON "JobPosting"("recruiterId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCandidate" ADD CONSTRAINT "RecruitmentCandidate_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCandidate" ADD CONSTRAINT "RecruitmentCandidate_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCandidate" ADD CONSTRAINT "RecruitmentCandidate_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_recruitmentCandidateId_fkey" FOREIGN KEY ("recruitmentCandidateId") REFERENCES "RecruitmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInterviewer" ADD CONSTRAINT "InterviewInterviewer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInterviewer" ADD CONSTRAINT "InterviewInterviewer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_recruitmentCandidateId_fkey" FOREIGN KEY ("recruitmentCandidateId") REFERENCES "RecruitmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProject" ADD CONSTRAINT "WorkProject_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProjectMember" ADD CONSTRAINT "WorkProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "WorkProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProjectMember" ADD CONSTRAINT "WorkProjectMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskList" ADD CONSTRAINT "WorkTaskList_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "WorkProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_taskListId_fkey" FOREIGN KEY ("taskListId") REFERENCES "WorkTaskList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskChecklistItem" ADD CONSTRAINT "WorkTaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskDependency" ADD CONSTRAINT "WorkTaskDependency_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "WorkTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskDependency" ADD CONSTRAINT "WorkTaskDependency_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "WorkTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskComment" ADD CONSTRAINT "WorkTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskComment" ADD CONSTRAINT "WorkTaskComment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskAttachment" ADD CONSTRAINT "WorkTaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTaskAttachment" ADD CONSTRAINT "WorkTaskAttachment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertSchedule" ADD CONSTRAINT "AlertSchedule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertScheduleParticipant" ADD CONSTRAINT "AlertScheduleParticipant_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AlertSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertScheduleParticipant" ADD CONSTRAINT "AlertScheduleParticipant_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AlertSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDelivery" ADD CONSTRAINT "AlertDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AlertEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDelivery" ADD CONSTRAINT "AlertDelivery_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSpace" ADD CONSTRAINT "KnowledgeSpace_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSpacePermission" ADD CONSTRAINT "KnowledgeSpacePermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "KnowledgeSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSpacePermission" ADD CONSTRAINT "KnowledgeSpacePermission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeLabel" ADD CONSTRAINT "KnowledgeLabel_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "KnowledgeSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePage" ADD CONSTRAINT "KnowledgePage_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "KnowledgeSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePage" ADD CONSTRAINT "KnowledgePage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePage" ADD CONSTRAINT "KnowledgePage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePage" ADD CONSTRAINT "KnowledgePage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePagePermission" ADD CONSTRAINT "KnowledgePagePermission_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePagePermission" ADD CONSTRAINT "KnowledgePagePermission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageVersion" ADD CONSTRAINT "KnowledgePageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageVersion" ADD CONSTRAINT "KnowledgePageVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageLabel" ADD CONSTRAINT "KnowledgePageLabel_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageLabel" ADD CONSTRAINT "KnowledgePageLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "KnowledgeLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageComment" ADD CONSTRAINT "KnowledgePageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageComment" ADD CONSTRAINT "KnowledgePageComment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageComment" ADD CONSTRAINT "KnowledgePageComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgePageComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageAttachment" ADD CONSTRAINT "KnowledgePageAttachment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePageAttachment" ADD CONSTRAINT "KnowledgePageAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowBoard" ADD CONSTRAINT "FlowBoard_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowBoardMember" ADD CONSTRAINT "FlowBoardMember_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "FlowBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowBoardMember" ADD CONSTRAINT "FlowBoardMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowBoardInvite" ADD CONSTRAINT "FlowBoardInvite_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "FlowBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowBoardInvite" ADD CONSTRAINT "FlowBoardInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowColumn" ADD CONSTRAINT "FlowColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "FlowBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowCard" ADD CONSTRAINT "FlowCard_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "FlowColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowLabel" ADD CONSTRAINT "FlowLabel_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "FlowBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowCardLabel" ADD CONSTRAINT "FlowCardLabel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "FlowCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowCardLabel" ADD CONSTRAINT "FlowCardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "FlowLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowCardMember" ADD CONSTRAINT "FlowCardMember_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "FlowCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowCardMember" ADD CONSTRAINT "FlowCardMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowChecklist" ADD CONSTRAINT "FlowChecklist_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "FlowCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowChecklistItem" ADD CONSTRAINT "FlowChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "FlowChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowComment" ADD CONSTRAINT "FlowComment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "FlowCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowComment" ADD CONSTRAINT "FlowComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowAttachment" ADD CONSTRAINT "FlowAttachment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "FlowCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowAttachment" ADD CONSTRAINT "FlowAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowCardReminder" ADD CONSTRAINT "FlowCardReminder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowCardReminder" ADD CONSTRAINT "FlowCardReminder_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "FlowCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgDepartment" ADD CONSTRAINT "OrgDepartment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgDepartment" ADD CONSTRAINT "OrgDepartment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgRole" ADD CONSTRAINT "OrgRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgGroup" ADD CONSTRAINT "OrgGroup_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUser" ADD CONSTRAINT "OrgUser_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUser" ADD CONSTRAINT "OrgUser_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUser" ADD CONSTRAINT "OrgUser_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "OrgDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUser" ADD CONSTRAINT "OrgUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "OrgRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUserGroup" ADD CONSTRAINT "OrgUserGroup_orgUserId_fkey" FOREIGN KEY ("orgUserId") REFERENCES "OrgUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUserGroup" ADD CONSTRAINT "OrgUserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OrgGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInvitation" ADD CONSTRAINT "OrgInvitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInvitation" ADD CONSTRAINT "OrgInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInvitation" ADD CONSTRAINT "OrgInvitation_invitedForId_fkey" FOREIGN KEY ("invitedForId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgSsoConfig" ADD CONSTRAINT "OrgSsoConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMfaPolicy" ADD CONSTRAINT "OrgMfaPolicy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMfaEnrollment" ADD CONSTRAINT "OrgMfaEnrollment_orgUserId_fkey" FOREIGN KEY ("orgUserId") REFERENCES "OrgUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeRepository" ADD CONSTRAINT "CodeRepository_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeRepoCollaborator" ADD CONSTRAINT "CodeRepoCollaborator_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "CodeRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeRepoCollaborator" ADD CONSTRAINT "CodeRepoCollaborator_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeBranch" ADD CONSTRAINT "CodeBranch_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "CodeRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeBranch" ADD CONSTRAINT "CodeBranch_headCommitId_fkey" FOREIGN KEY ("headCommitId") REFERENCES "CodeCommit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeCommit" ADD CONSTRAINT "CodeCommit_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "CodeRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeCommit" ADD CONSTRAINT "CodeCommit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "CodeBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeCommit" ADD CONSTRAINT "CodeCommit_parentCommitId_fkey" FOREIGN KEY ("parentCommitId") REFERENCES "CodeCommit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeCommit" ADD CONSTRAINT "CodeCommit_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeCommitFile" ADD CONSTRAINT "CodeCommitFile_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "CodeCommit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeRepoLabel" ADD CONSTRAINT "CodeRepoLabel_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "CodeRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePullRequest" ADD CONSTRAINT "CodePullRequest_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "CodeRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePullRequest" ADD CONSTRAINT "CodePullRequest_sourceBranchId_fkey" FOREIGN KEY ("sourceBranchId") REFERENCES "CodeBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePullRequest" ADD CONSTRAINT "CodePullRequest_targetBranchId_fkey" FOREIGN KEY ("targetBranchId") REFERENCES "CodeBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePullRequest" ADD CONSTRAINT "CodePullRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRReviewer" ADD CONSTRAINT "CodePRReviewer_prId_fkey" FOREIGN KEY ("prId") REFERENCES "CodePullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRReviewer" ADD CONSTRAINT "CodePRReviewer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRComment" ADD CONSTRAINT "CodePRComment_prId_fkey" FOREIGN KEY ("prId") REFERENCES "CodePullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRComment" ADD CONSTRAINT "CodePRComment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRComment" ADD CONSTRAINT "CodePRComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CodePRComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRLabel" ADD CONSTRAINT "CodePRLabel_prId_fkey" FOREIGN KEY ("prId") REFERENCES "CodePullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRLabel" ADD CONSTRAINT "CodePRLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "CodeRepoLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePRLinkedIssue" ADD CONSTRAINT "CodePRLinkedIssue_prId_fkey" FOREIGN KEY ("prId") REFERENCES "CodePullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAIAudit" ADD CONSTRAINT "JobAIAudit_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildPipeline" ADD CONSTRAINT "BuildPipeline_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildPipeline" ADD CONSTRAINT "BuildPipeline_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "CodeRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildRun" ADD CONSTRAINT "BuildRun_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "BuildPipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobStrategyPlan" ADD CONSTRAINT "JobStrategyPlan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobIntegration" ADD CONSTRAINT "JobIntegration_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTeam" ADD CONSTRAINT "JobTeam_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTeam" ADD CONSTRAINT "JobTeam_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTeam" ADD CONSTRAINT "JobTeam_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPage" ADD CONSTRAINT "StatusPage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageComponent" ADD CONSTRAINT "StatusPageComponent_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "StatusPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusIncident" ADD CONSTRAINT "StatusIncident_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "StatusPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusIncident" ADD CONSTRAINT "StatusIncident_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusIncidentUpdate" ADD CONSTRAINT "StatusIncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "StatusIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusIncidentUpdate" ADD CONSTRAINT "StatusIncidentUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusIncidentComponent" ADD CONSTRAINT "StatusIncidentComponent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "StatusIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusIncidentComponent" ADD CONSTRAINT "StatusIncidentComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "StatusPageComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOwner" ADD CONSTRAINT "ServiceOwner_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOwner" ADD CONSTRAINT "ServiceOwner_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDependency" ADD CONSTRAINT "ServiceDependency_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDependency" ADD CONSTRAINT "ServiceDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHealthCheck" ADD CONSTRAINT "ServiceHealthCheck_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasObjective" ADD CONSTRAINT "AtlasObjective_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasObjective" ADD CONSTRAINT "AtlasObjective_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AtlasObjective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasObjective" ADD CONSTRAINT "AtlasObjective_linkedProjectId_fkey" FOREIGN KEY ("linkedProjectId") REFERENCES "TrackProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasKeyResult" ADD CONSTRAINT "AtlasKeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "AtlasObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasProgressUpdate" ADD CONSTRAINT "AtlasProgressUpdate_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "AtlasKeyResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasProgressUpdate" ADD CONSTRAINT "AtlasProgressUpdate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasKeyResultIssueLink" ADD CONSTRAINT "AtlasKeyResultIssueLink_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "AtlasKeyResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasKeyResultIssueLink" ADD CONSTRAINT "AtlasKeyResultIssueLink_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "TrackIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocLink" ADD CONSTRAINT "ServiceDocLink_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocLink" ADD CONSTRAINT "ServiceDocLink_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaExpiration" ADD CONSTRAINT "MediaExpiration_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignInsight" ADD CONSTRAINT "AdCampaignInsight_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAudience" ADD CONSTRAINT "AdAudience_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignAudience" ADD CONSTRAINT "AdCampaignAudience_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignAudience" ADD CONSTRAINT "AdCampaignAudience_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "AdAudience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdBillingAccount" ADD CONSTRAINT "AdBillingAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdInvoice" ADD CONSTRAINT "AdInvoice_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "AdBillingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreditTransaction" ADD CONSTRAINT "AdCreditTransaction_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "AdBillingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreditTransaction" ADD CONSTRAINT "AdCreditTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AdInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdFraudSignal" ADD CONSTRAINT "AdFraudSignal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdFraudSignal" ADD CONSTRAINT "AdFraudSignal_advertiserAccountId_fkey" FOREIGN KEY ("advertiserAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdFraudBlock" ADD CONSTRAINT "AdFraudBlock_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdFraudBlock" ADD CONSTRAINT "AdFraudBlock_advertiserAccountId_fkey" FOREIGN KEY ("advertiserAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
