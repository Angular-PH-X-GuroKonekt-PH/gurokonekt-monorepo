-- Allow duplicate phone numbers by removing the unique constraint/index.
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_number_key";
DROP INDEX IF EXISTS "users_phone_number_key";
