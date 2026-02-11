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

export enum DaysInWeek {
  Monday = "monday",
  Tuesday = "tuesday",
  Wednesday = "wednesday",
  Thursday = "thursday",
  Friday = "friday",
  Saturday = "saturday",
  Sunday = "sunday",
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
  isMentorProfileComplete: boolean;
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
  availability: UserAvailabilityInterface[];
  user: UserInterface;
  updatedAt: string;
  updatedBy: UserFlatInterface;
}

export interface UpdateMenteeProfileInterface {
  bio: string;
  phoneNumber: string;
  country: string;
  language: string;
  timezone: string;
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
  availability: UserAvailabilityInterface[];
  user: UserInterface;
  updatedAt: string;
  updatedBy: UserFlatInterface;
}

export interface UpdateMentorProfileInterface {
  bio: string;
  phoneNumber: string;
  country: string;
  language: string;
  timezone: string;
  areasOfExpertise: string[];
  yearsOfExperience: number;
  skills: string[];
  sessionRate?: number;
  availability: UserAvailabilityInterface[];
  updatedById: string;
}

export interface UserAvailabilityInterface {
  day: DaysInWeek;
  timeFrames: TimeFrameInterface[]; 
}

export interface TimeFrameInterface {
  from: string; 
  to: string;  
}