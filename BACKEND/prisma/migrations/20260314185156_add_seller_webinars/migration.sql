-- CreateTable
CREATE TABLE "SellerWebinar" (
    "id" TEXT NOT NULL,
    "topic" VARCHAR(80) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(1000) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerWebinar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerWebinar_topic_idx" ON "SellerWebinar"("topic");
