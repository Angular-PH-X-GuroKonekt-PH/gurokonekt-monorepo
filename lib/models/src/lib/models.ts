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
  PendingApproval = "pending approval",
  PendingReview = "pending review",
  Approved = "approved",
  Rejected = "rejected",
  Banned = "banned",
  Suspended = "suspended",
  Deleted = "deleted",
  Unknown = "unknown",
  NotApplicable = "not applicable",
  NotSpecified = "not specified",
}

export enum MenteePreferredSessionType {
  Online = "online",
  InPerson = "in-person",
}

export enum LogsActionType {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
  Signin = "signin",
  SignUp = "signup",
  Signout = "signout",
}