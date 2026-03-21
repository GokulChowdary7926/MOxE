-- Separate counters: text messages (10/day) vs photo posts (1/day)
ALTER TABLE "Account" ADD COLUMN "nearbyTextMessageCountToday" INTEGER NOT NULL DEFAULT 0;
