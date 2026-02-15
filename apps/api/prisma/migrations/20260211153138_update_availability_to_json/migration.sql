/*
  Warnings:

  - Changed the type of `availability` on the `mentee_profiles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `availability` on the `mentor_profiles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "mentee_profiles" DROP COLUMN "availability",
ADD COLUMN     "availability" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "mentor_profiles" DROP COLUMN "availability",
ADD COLUMN     "availability" JSONB NOT NULL;
