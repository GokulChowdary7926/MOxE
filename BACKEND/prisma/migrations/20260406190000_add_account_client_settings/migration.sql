-- Persist granular app settings (notification sub-pages, etc.)
ALTER TABLE "Account" ADD COLUMN "clientSettings" JSONB;
