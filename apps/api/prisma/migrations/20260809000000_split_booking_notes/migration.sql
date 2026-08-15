-- Existing booking notes are intentionally discarded.
ALTER TABLE "bookings" DROP COLUMN "notes";

ALTER TABLE "bookings" ADD COLUMN "mentee_notes" TEXT;
ALTER TABLE "bookings" ADD COLUMN "mentor_notes" TEXT;
