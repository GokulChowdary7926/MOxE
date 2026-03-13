-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "customDomain" VARCHAR(253),
ADD COLUMN     "customDomainVerifiedAt" TIMESTAMP(3);
