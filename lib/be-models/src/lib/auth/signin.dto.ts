import { ResendConfirmationEmailInterface, ResendOTPTypes, SignInWithOAthInterface, SignInWithOAthProviders, SignInWithPasswordInterface } from "@gurokonekt/models";

export class SignInWithPasswordDto implements SignInWithPasswordInterface {
  email!: string;
  password!: string;
}

export class SignInWithOAthDto implements SignInWithOAthInterface {
  provider!: SignInWithOAthProviders;
}

export class ResendConfirmationEmailDto implements ResendConfirmationEmailInterface{
  type!: ResendOTPTypes.SignUp;
  email!: string;
}