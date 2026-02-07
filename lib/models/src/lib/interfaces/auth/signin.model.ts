export enum SignInWithOAthProviders {
  Google = 'google',
  Github = 'github',
}

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

export interface SignInWithOAthInterface {
  provider: SignInWithOAthProviders;
}

export interface ResendConfirmationEmailInterface {
  type: ResendOTPTypes.SignUp;
  email: string;
}