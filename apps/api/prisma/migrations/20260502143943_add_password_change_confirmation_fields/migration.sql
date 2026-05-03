-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pending_hash_password" TEXT,
ADD COLUMN     "pending_password_change_at" TIMESTAMP(3);
