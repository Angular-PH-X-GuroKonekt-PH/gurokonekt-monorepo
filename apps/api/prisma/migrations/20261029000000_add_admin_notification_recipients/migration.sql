-- AlterEnum
ALTER TYPE "logs_action_type" ADD VALUE 'admin_add_notification_recipient';
ALTER TYPE "logs_action_type" ADD VALUE 'admin_remove_notification_recipient';

-- CreateTable
CREATE TABLE "admin_notification_recipients" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_notification_recipients_email_key" ON "admin_notification_recipients"("email");
