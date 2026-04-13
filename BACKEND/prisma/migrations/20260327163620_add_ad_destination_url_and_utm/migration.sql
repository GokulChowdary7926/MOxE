-- AlterTable
ALTER TABLE "AdCampaign" ADD COLUMN     "destinationUrl" VARCHAR(1000),
ADD COLUMN     "utmCampaign" VARCHAR(150),
ADD COLUMN     "utmContent" VARCHAR(150),
ADD COLUMN     "utmMedium" VARCHAR(100),
ADD COLUMN     "utmSource" VARCHAR(100),
ADD COLUMN     "utmTerm" VARCHAR(150);
