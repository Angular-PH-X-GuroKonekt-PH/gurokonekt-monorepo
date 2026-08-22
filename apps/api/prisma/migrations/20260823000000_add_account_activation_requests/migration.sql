CREATE TYPE "account_activation_request_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "account_activation_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "account_activation_request_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "account_activation_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_activation_requests_user_id_key" ON "account_activation_requests"("user_id");

ALTER TABLE "account_activation_requests"
  ADD CONSTRAINT "account_activation_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
