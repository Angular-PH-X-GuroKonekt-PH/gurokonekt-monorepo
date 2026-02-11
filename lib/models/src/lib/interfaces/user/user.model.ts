import { AvatarAttachmentsInterface } from "../attachments/attachments.model";

export enum UserRole {
  Mentee = "mentee",
  Mentor = "mentor",
  Admin = "admin",
}

export enum UserStatus {
  Active = "active",
  Inactive = "inactive",
  PendingApproval = "pending_approval",
  PendingReview = "pending_review",
  Approved = "approved",
  Rejected = "rejected",
  Banned = "banned",
  Suspended = "suspended",
  Deleted = "deleted"
}

export enum MenteePreferredSessionType {
  InPerson = "in_person",
  Online = "online",
}

export interface UserInterface {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phoneNumber: string;
  country: string;
  language: string;
  timezone: string;
  isProfileComplete: boolean;
  isMentorApproved: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  avatarAttachments: AvatarAttachmentsInterface;
  createdBy: UserFlatInterface;
  updatedBy: UserFlatInterface;
}

export interface UserFlatInterface {
  id: string;
  firstName: string;
  lastName: string;
}

export interface MenteeProfileInterface {
  id: string;
  bio: string;
  learningGoals: string[];
  areasOfInterest: string[];
  preferredSessionType: MenteePreferredSessionType;
  availability: string[];
  user: UserInterface;
  updatedAt: string;
  updatedBy: UserFlatInterface;
}

export interface MenteeProfileUpdateInterface {
  bio: string;
  learningGoals: string[];
  areasOfInterest: string[];
  preferredSessionType: MenteePreferredSessionType;
  availability: UserAvailabilityInterface[];
  updatedById: string;
}

export interface MentorProfileInterface {
  id: string;
  bio: string;
  areasOfExpertise: string[];
  yearsOfExperience: number;
  linkedInUrl: string;
  skills: string[];
  sessionRate: number;
  availability: string[];
  user: UserInterface;
  updatedAt: string;
  updatedBy: UserFlatInterface;
}

export interface UserAvailabilityInterface {
  day: string;
  time: string;
}