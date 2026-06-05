import { UserFlatInterface } from "../user/user.model";

export enum LogsActionType {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
  SignIn = "signin",
  SignUp = "signup",
  Signout = "signout",
  ResendEmailConfirmation = "resend_email_confirmation",
  UpdatePassword = "update_password",
  ForgotPassword = "forgot_password",
  ResetPassword = "reset_password",
  VerifyResetPin = "verify_reset_pin",
  DeactivateAccount = "deactivate_account",
  AdminForceCancelBooking = "admin_force_cancel_booking",
  AdminActivateMentee = "admin_activate_mentee",
  AdminDeactivateMentee = "admin_deactivate_mentee",
  AdminRejectMentee = "admin_reject_mentee",
  AdminResendVerification = "admin_resend_verification",
}

export interface LogsInterface {
    id: string;
    actionType: LogsActionType;
    targetId: string;
    details: string;
    metadata: unknown | null;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    updatedAt: string;
    createdBy: UserFlatInterface;
    updatedBy: UserFlatInterface;
}