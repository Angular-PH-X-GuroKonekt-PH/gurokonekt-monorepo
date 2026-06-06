-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "logs_action_type" ADD VALUE 'admin_approve_mentor';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_reject_mentor';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_deactivate_mentor';

-- DropForeignKey
ALTER TABLE "admin_rejection_logs" DROP CONSTRAINT "admin_rejection_logs_mentee_id_fkey";

-- AlterTable
ALTER TABLE "admin_rejection_logs" ADD COLUMN     "mentor_id" TEXT,
ALTER COLUMN "mentee_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mentee_profiles" ALTER COLUMN "preferred_session_type" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "admin_rejection_logs" ADD CONSTRAINT "admin_rejection_logs_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_rejection_logs" ADD CONSTRAINT "admin_rejection_logs_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
