-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "logs_action_type" ADD VALUE 'admin_feature_mentor';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_unfeature_mentor';

-- AlterTable
ALTER TABLE "mentor_profiles" ADD COLUMN     "featured_at" TIMESTAMP(3),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "mentor_profiles_is_featured_idx" ON "mentor_profiles"("is_featured");
