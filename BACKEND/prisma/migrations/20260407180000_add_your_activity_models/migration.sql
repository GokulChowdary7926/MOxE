-- Your Activity: screen time, recent searches, link opens, account change log

CREATE TABLE "ScreenTimeDaily" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreenTimeDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScreenTimeDaily_accountId_day_key" ON "ScreenTimeDaily"("accountId", "day");
CREATE INDEX "ScreenTimeDaily_accountId_idx" ON "ScreenTimeDaily"("accountId");

ALTER TABLE "ScreenTimeDaily" ADD CONSTRAINT "ScreenTimeDaily_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RecentSearchEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "term" VARCHAR(200) NOT NULL,
    "refId" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentSearchEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecentSearchEntry_accountId_createdAt_idx" ON "RecentSearchEntry"("accountId", "createdAt");

ALTER TABLE "RecentSearchEntry" ADD CONSTRAINT "RecentSearchEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LinkOpen" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "title" VARCHAR(500),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkOpen_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LinkOpen_accountId_openedAt_idx" ON "LinkOpen"("accountId", "openedAt");

ALTER TABLE "LinkOpen" ADD CONSTRAINT "LinkOpen_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AccountActivityLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200),
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccountActivityLog_accountId_createdAt_idx" ON "AccountActivityLog"("accountId", "createdAt");

ALTER TABLE "AccountActivityLog" ADD CONSTRAINT "AccountActivityLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
