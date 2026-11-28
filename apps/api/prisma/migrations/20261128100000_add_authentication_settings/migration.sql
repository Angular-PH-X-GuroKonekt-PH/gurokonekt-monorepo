-- AlterEnum
ALTER TYPE "logs_action_type" ADD VALUE 'admin_update_auth_settings';
ALTER TYPE "logs_action_type" ADD VALUE 'password_set';

-- CreateTable
CREATE TABLE "authentication_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "passkey_required" BOOLEAN NOT NULL DEFAULT true,
    "google_required" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authentication_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "authentication_settings" ADD CONSTRAINT "authentication_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The single settings row. Both requirements start on (#463).
INSERT INTO "authentication_settings" ("id", "passkey_required", "google_required", "updated_at")
VALUES (1, true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
