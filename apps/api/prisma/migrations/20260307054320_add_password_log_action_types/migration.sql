-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "logs_action_type" ADD VALUE 'update_password';
ALTER TYPE "logs_action_type" ADD VALUE 'forgot_password';
ALTER TYPE "logs_action_type" ADD VALUE 'reset_password';
ALTER TYPE "logs_action_type" ADD VALUE 'verify_reset_pin';
