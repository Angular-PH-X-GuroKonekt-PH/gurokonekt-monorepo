-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "logs_action_type" ADD VALUE 'admin_activate_mentee';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_deactivate_mentee';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_reject_mentee';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_resend_verification';

-- CreateTable
CREATE TABLE "admin_rejection_logs" (
    "id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_rejection_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "admin_rejection_logs" ADD CONSTRAINT "admin_rejection_logs_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_rejection_logs" ADD CONSTRAINT "admin_rejection_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
