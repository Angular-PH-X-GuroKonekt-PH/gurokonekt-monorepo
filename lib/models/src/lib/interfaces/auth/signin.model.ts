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