export enum ResendOTPTypes {
  SignUp = 'signup',
  SMS = 'sms',
  ChangeEmail = 'email_change',
  ChangePhone = 'phone_change'
}

export interface SignInWithPasswordInterface {
  email: string;
  password: string;
}

export interface SignInWithGoogleInterface {
  idToken: string;
  nonce?: string;
}

export interface ResendConfirmationEmailInterface {
  type: ResendOTPTypes.SignUp;
  email: string;
  emailRedirectTo?: string;
}
/**
 * Returned by Google sign-in when the Google account has no GuroKonekt account
 * yet. The tokens prove the Google identity until the registration form is
 * submitted; the prefill comes from the Google profile.
 */
export interface GoogleRegistrationRequiredInterface {
  registrationRequired: true;
  registration: GoogleRegistrationTokensInterface;
  prefill: GoogleRegistrationPrefillInterface;
}

export interface GoogleRegistrationTokensInterface {
  registrationToken: string;
  refreshToken?: string;
}

export interface GoogleRegistrationPrefillInterface {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}
