CREATE TYPE "email_delivery_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "email_deliveries" (
    "id" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "booking_id" TEXT,
    "recipient_email" TEXT NOT NULL,
    "status" "email_delivery_status" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "provider_message_id" TEXT,
    "last_error" TEXT,
    "attempted_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_deliveries_event_key_key" ON "email_deliveries"("event_key");
CREATE INDEX "email_deliveries_status_created_at_idx" ON "email_deliveries"("status", "created_at");
CREATE INDEX "email_deliveries_booking_id_idx" ON "email_deliveries"("booking_id");

ALTER TABLE "email_deliveries"
ADD CONSTRAINT "email_deliveries_booking_id_fkey"
FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
