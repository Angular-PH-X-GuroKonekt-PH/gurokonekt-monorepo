-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Mentee', 'Mentor', 'Admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive', 'PendingApproval', 'PendingReview', 'Approved', 'Rejected', 'Banned', 'Suspended', 'Deleted', 'Unknown', 'NotApplicable', 'NotSpecified');

-- CreateEnum
CREATE TYPE "MenteePreferredSessionType" AS ENUM ('Online', 'InPerson');

-- CreateEnum
CREATE TYPE "LogsActionType" AS ENUM ('Create', 'Read', 'Update', 'Delete', 'Signin', 'SignUp', 'Signout');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenteeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT,
    "language" TEXT,
    "bio" TEXT,
    "learningGoals" TEXT[],
    "areasOfInterest" TEXT[],
    "preferredSessionType" "MenteePreferredSessionType" NOT NULL,
    "availability" TEXT[],
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenteeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT,
    "language" TEXT,
    "yearsOfExperience" INTEGER,
    "linkedInUrl" TEXT,
    "bio" TEXT,
    "skills" TEXT[],
    "sessionRate" DOUBLE PRECISION,
    "availability" TEXT[],
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarAttachments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarStoragePath" TEXT NOT NULL,
    "avatarPublicUrl" TEXT NOT NULL,
    "avatarFileType" TEXT NOT NULL,
    "avatarFileSize" INTEGER NOT NULL,
    "avatarFileName" TEXT NOT NULL,

    CONSTRAINT "AvatarAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAttachments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentStoragePath" TEXT NOT NULL,
    "documentPublicUrl" TEXT NOT NULL,
    "documentFileType" TEXT NOT NULL,
    "documentFileSize" INTEGER NOT NULL,
    "documentFileName" TEXT NOT NULL,

    CONSTRAINT "DocumentAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logs" (
    "id" TEXT NOT NULL,
    "actionType" "LogsActionType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MenteeProfile_userId_key" ON "MenteeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenteeProfile" ADD CONSTRAINT "MenteeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenteeProfile" ADD CONSTRAINT "MenteeProfile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarAttachments" ADD CONSTRAINT "AvatarAttachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAttachments" ADD CONSTRAINT "DocumentAttachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
