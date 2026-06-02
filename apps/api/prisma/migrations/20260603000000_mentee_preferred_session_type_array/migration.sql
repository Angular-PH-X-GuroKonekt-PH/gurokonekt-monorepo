-- Convert mentee preferred_session_type from a single enum value to an array of enum values
ALTER TABLE "mentee_profiles"
  ALTER COLUMN "preferred_session_type" DROP NOT NULL,
  ALTER COLUMN "preferred_session_type" TYPE "mentee_preferred_session_type"[]
    USING (
      CASE
        WHEN "preferred_session_type" IS NULL THEN ARRAY[]::"mentee_preferred_session_type"[]
        ELSE ARRAY["preferred_session_type"]
      END
    ),
  ALTER COLUMN "preferred_session_type" SET DEFAULT ARRAY[]::"mentee_preferred_session_type"[];
