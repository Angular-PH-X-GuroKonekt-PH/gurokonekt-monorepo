export interface UpdatePasswordInterface {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordInterface {
  email: string;
}

export interface CompletePasswordResetInterface {
  accessToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordInterface {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyResetPinInterface {
  email: string;
  pin: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyPasswordChangeInterface {
  userId: string;
  pin: string;
  newPassword: string;
}
