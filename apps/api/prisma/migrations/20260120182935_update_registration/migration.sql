/*
  Warnings:

  - You are about to drop the column `country` on the `MenteeProfile` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `MenteeProfile` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `MentorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `MentorProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MenteeProfile" DROP COLUMN "country",
DROP COLUMN "language";

-- AlterTable
ALTER TABLE "MentorProfile" DROP COLUMN "country",
DROP COLUMN "language";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "country" TEXT,
ADD COLUMN     "language" TEXT;
