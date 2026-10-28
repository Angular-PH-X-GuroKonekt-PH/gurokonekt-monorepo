import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { 
  ResendConfirmationEmailInterface, 
  ResendOTPTypes, 
  SignInWithGoogleInterface,
  SignInWithPasswordInterface
} from "@gurokonekt/models";

export class SignInWithPasswordDto implements SignInWithPasswordInterface {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password!: string;
}

export class SignInWithGoogleDto implements SignInWithGoogleInterface {
  @IsString({ message: 'idToken must be a string' })
  @IsNotEmpty({ message: 'idToken cannot be empty' })
  idToken!: string;

  @IsOptional()
  @IsString({ message: 'nonce must be a string' })
  nonce?: string;
}

export class ResendConfirmationEmailDto implements ResendConfirmationEmailInterface{
  @IsEnum(ResendOTPTypes, { message: 'Type must be a valid ResendOTPTypes value' })
  type!: ResendOTPTypes.SignUp;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsOptional()
  @IsUrl({}, { message: 'emailRedirectTo must be a valid URL' })
  emailRedirectTo?: string;
}