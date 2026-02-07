import { 
  IsEmail, 
  IsEnum, 
  IsNotEmpty, 
  IsString 
} from 'class-validator';
import { 
  ResendConfirmationEmailInterface, 
  ResendOTPTypes, 
  SignInWithOAthInterface, 
  SignInWithOAthProviders, 
  SignInWithPasswordInterface 
} from "@gurokonekt/models";

export class SignInWithPasswordDto implements SignInWithPasswordInterface {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password!: string;
}

export class SignInWithOAthDto implements SignInWithOAthInterface {
  @IsEnum(SignInWithOAthProviders, { message: 'Provider must be a valid OAuth provider' })
  provider!: SignInWithOAthProviders;
}

export class ResendConfirmationEmailDto implements ResendConfirmationEmailInterface{
  @IsEnum(ResendOTPTypes, { message: 'Type must be a valid ResendOTPTypes value' })
  type!: ResendOTPTypes.SignUp;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;
}