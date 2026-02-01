/*
  Warnings:

  - You are about to drop the `AvatarAttachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentAttachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MenteeProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MentorProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('mentee', 'mentor', 'admin');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'pending_approval', 'pending_review', 'approved', 'rejected', 'banned', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "mentee_preferred_session_type" AS ENUM ('online', 'in_person');

-- CreateEnum
CREATE TYPE "logs_action_type" AS ENUM ('create', 'read', 'update', 'delete', 'signin', 'signup', 'signout');

-- DropForeignKey
ALTER TABLE "AvatarAttachments" DROP CONSTRAINT "AvatarAttachments_userId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentAttachments" DROP CONSTRAINT "DocumentAttachments_userId_fkey";

-- DropForeignKey
ALTER TABLE "Logs" DROP CONSTRAINT "Logs_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Logs" DROP CONSTRAINT "Logs_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "MenteeProfile" DROP CONSTRAINT "MenteeProfile_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "MenteeProfile" DROP CONSTRAINT "MenteeProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "MentorProfile" DROP CONSTRAINT "MentorProfile_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "MentorProfile" DROP CONSTRAINT "MentorProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_createdById_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_updatedById_fkey";

-- DropTable
DROP TABLE "AvatarAttachments";

-- DropTable
DROP TABLE "DocumentAttachments";

-- DropTable
DROP TABLE "Logs";

-- DropTable
DROP TABLE "MenteeProfile";

-- DropTable
DROP TABLE "MentorProfile";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "LogsActionType";

-- DropEnum
DROP TYPE "MenteePreferredSessionType";

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "UserStatus";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "suffix" TEXT,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "timezone" TEXT,
    "language" TEXT,
    "phone_number" TEXT,
    "hash_password" TEXT NOT NULL,
    "is_profile_complete" BOOLEAN NOT NULL DEFAULT true,
    "is_mentor_approved" BOOLEAN NOT NULL DEFAULT false,
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentee_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "learning_goals" TEXT[],
    "areas_of_interest" TEXT[],
    "preferred_session_type" "mentee_preferred_session_type" NOT NULL,
    "availability" TEXT[],
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "areas_of_expertise" TEXT[],
    "years_of_experience" INTEGER,
    "linkedin_url" TEXT,
    "bio" TEXT,
    "skills" TEXT[],
    "session_rate" DOUBLE PRECISION,
    "availability" TEXT[],
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatar_attachments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,

    CONSTRAINT "avatar_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_attachments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,

    CONSTRAINT "document_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "action_type" "logs_action_type" NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "mentee_profiles_user_id_key" ON "mentee_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_user_id_key" ON "mentor_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentee_profiles" ADD CONSTRAINT "mentee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentee_profiles" ADD CONSTRAINT "mentee_profiles_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avatar_attachments" ADD CONSTRAINT "avatar_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
