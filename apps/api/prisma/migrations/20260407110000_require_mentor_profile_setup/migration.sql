-- Require mentor profile setup before dashboard access.
ALTER TABLE "users"
ALTER COLUMN "is_mentor_profile_complete" SET DEFAULT false;

UPDATE "users" u
SET "is_mentor_profile_complete" = false
FROM "mentor_profiles" mp
WHERE u."id" = mp."user_id"
  AND u."role" = 'mentor'
  AND (
    COALESCE(mp."bio", '') = ''
    OR COALESCE(array_length(mp."skills", 1), 0) = 0
    OR jsonb_typeof(mp."availability"::jsonb) <> 'array'
    OR jsonb_array_length(mp."availability"::jsonb) = 0
  );
