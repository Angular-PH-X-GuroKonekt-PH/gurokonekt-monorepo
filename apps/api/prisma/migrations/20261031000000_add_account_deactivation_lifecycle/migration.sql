-- AlterEnum
ALTER TYPE "logs_action_type" ADD VALUE 'admin_approve_mentor_reactivation';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_reject_mentor_reactivation';
ALTER TYPE "logs_action_type" ADD VALUE 'account_auto_deleted';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "deactivated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "account_activation_requests" ADD COLUMN "reviewed_by_id" TEXT,
ADD COLUMN "review_note" TEXT;

-- Backfill: users who are inactive because they deactivated themselves get the
-- time of their latest self-deactivation, so the 30-day clock starts from when
-- they actually left. Admin-deactivated accounts have no such log and stay null.
UPDATE "users" u
SET "deactivated_at" = l.deactivated_at
FROM (
  SELECT "target_id", MAX("created_at") AS deactivated_at
  FROM "logs"
  WHERE "action_type" = 'deactivate_account' AND "details" = 'Account deactivated'
  GROUP BY "target_id"
) l
WHERE u."id" = l."target_id" AND u."status" = 'inactive';
