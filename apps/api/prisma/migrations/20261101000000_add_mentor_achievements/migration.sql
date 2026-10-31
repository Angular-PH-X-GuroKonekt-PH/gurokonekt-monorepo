-- CreateEnum
CREATE TYPE "achievement_award_type" AS ENUM ('automatic', 'application');

-- CreateEnum
CREATE TYPE "mentor_achievement_status" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'revoked');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "logs_action_type" ADD VALUE 'admin_create_achievement';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_update_achievement';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_delete_achievement';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_approve_achievement';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_reject_achievement';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_revoke_achievement';
ALTER TYPE "logs_action_type" ADD VALUE 'mentor_apply_achievement';
ALTER TYPE "logs_action_type" ADD VALUE 'achievement_auto_awarded';

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "award_type" "achievement_award_type" NOT NULL,
    "requirements" TEXT,
    "requires_proof" BOOLEAN NOT NULL DEFAULT true,
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "criteria" JSONB NOT NULL DEFAULT '[]',
    "validity_months" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_achievements" (
    "id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "status" "mentor_achievement_status" NOT NULL DEFAULT 'pending',
    "details" TEXT,
    "earned_at" TIMESTAMP(3),
    "awarded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "proof_path" TEXT,
    "proof_file_name" TEXT,
    "proof_file_type" TEXT,
    "proof_file_size" INTEGER,
    "review_note" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mentor_achievements_status_idx" ON "mentor_achievements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_achievements_mentor_id_achievement_id_key" ON "mentor_achievements"("mentor_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_achievements" ADD CONSTRAINT "mentor_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_achievements" ADD CONSTRAINT "mentor_achievements_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_achievements" ADD CONSTRAINT "mentor_achievements_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
