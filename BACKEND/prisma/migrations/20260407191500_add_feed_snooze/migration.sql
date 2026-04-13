-- Feed snooze: temporarily hide accounts from home feed (viewer-specific).
CREATE TABLE "FeedSnooze" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "snoozedId" TEXT NOT NULL,
    "until" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedSnooze_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedSnooze_viewerId_snoozedId_key" ON "FeedSnooze"("viewerId", "snoozedId");
CREATE INDEX "FeedSnooze_viewerId_until_idx" ON "FeedSnooze"("viewerId", "until");

ALTER TABLE "FeedSnooze" ADD CONSTRAINT "FeedSnooze_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedSnooze" ADD CONSTRAINT "FeedSnooze_snoozedId_fkey" FOREIGN KEY ("snoozedId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
