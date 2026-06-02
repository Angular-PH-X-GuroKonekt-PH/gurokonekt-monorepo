-- AlterEnum
ALTER TYPE "logs_action_type" ADD VALUE 'admin_force_cancel_booking';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancel_reason" TEXT;

-- CreateTable
CREATE TABLE "booking_feedback" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_feedback_booking_id_user_id_key" ON "booking_feedback"("booking_id", "user_id");

-- AddForeignKey
ALTER TABLE "booking_feedback" ADD CONSTRAINT "booking_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_feedback" ADD CONSTRAINT "booking_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
