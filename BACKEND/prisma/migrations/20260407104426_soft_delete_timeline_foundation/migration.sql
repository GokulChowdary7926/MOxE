-- AlterTable
ALTER TABLE "AnonymousPost" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "Live" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "deleted_by_receiver_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_sender_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "Reel" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;
