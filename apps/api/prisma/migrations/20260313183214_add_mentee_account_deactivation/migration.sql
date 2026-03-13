-- AlterEnum
ALTER TYPE "logs_action_type" ADD VALUE 'deactivate_account';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deactivation_token" TEXT,
ADD COLUMN     "deactivation_token_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "deactivation_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deactivation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deactivation_feedback_user_id_key" ON "deactivation_feedback"("user_id");

-- AddForeignKey
ALTER TABLE "deactivation_feedback" ADD CONSTRAINT "deactivation_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
