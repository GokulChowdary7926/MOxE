-- Tag approval (manual review) and who added the tag.
ALTER TABLE "Tag" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Tag" ADD COLUMN "taggedById" TEXT;

CREATE INDEX "Tag_taggedById_idx" ON "Tag"("taggedById");
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_taggedById_fkey" FOREIGN KEY ("taggedById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
