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