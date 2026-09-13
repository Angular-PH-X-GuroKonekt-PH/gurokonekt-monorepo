ALTER TABLE "mentor_profiles"
ADD COLUMN "availability_timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "availability_overrides" JSONB NOT NULL DEFAULT '[]';

UPDATE "mentor_profiles" AS profile
SET "availability_timezone" = COALESCE(NULLIF("users"."timezone", ''), 'UTC')
FROM "users"
WHERE profile."user_id" = "users"."id";
