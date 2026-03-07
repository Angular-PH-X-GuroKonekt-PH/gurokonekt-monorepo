export interface UpdatePasswordInterface {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordInterface {
  email: string;
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
