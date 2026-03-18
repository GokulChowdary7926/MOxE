-- CreateTable
CREATE TABLE "AnonymousReport" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "targetId" VARCHAR(100),
    "reason" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnonymousReport_type_createdAt_idx" ON "AnonymousReport"("type", "createdAt");
