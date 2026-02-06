export type Creator = {
  id: string;
  name: string;
  image: string;
};

export interface AsyncReturn<T = unknown> {
  status: AsyncStatus
  message: string | null
  data: T | null
}

export enum AsyncStatus {
  Success = "success",
  Error = "error",
}

export enum UserRole {
  Mentee = "mentee",
  Mentor = "mentor",
  Admin = "admin",
}

export enum SignInWithOAthProviders {
  Google = 'google',
  Github = 'github',
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
  Deleted = "deleted",
  Unknown = "unknown",
  NotApplicable = "not_applicable",
  NotSpecified = "not_specified",
}

export enum MenteePreferredSessionType {
  Online = "online",
  InPerson = "in_person",
}

export enum LogsActionType {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
  Signin = "signin",
  SignUp = "signup",
  Signout = "signout",
  ResendEmail = "resend_email_confirmation",
}