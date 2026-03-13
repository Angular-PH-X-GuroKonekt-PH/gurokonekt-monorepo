import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  ForgotPasswordInterface,
  REGEX,
  ResetPasswordInterface,
  UpdatePasswordInterface,
  VerifyResetPinInterface,
} from '@gurokonekt/models';

const PASSWORD_VALIDATION_MESSAGE =
  'Password must be minimum 8 characters, include uppercase, lowercase, number, and symbol';

export class UpdatePasswordDto implements UpdatePasswordInterface {
  @IsString()
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  userId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  currentPassword!: string;

  @IsString()
  @Matches(REGEX.PASSWORD, { message: PASSWORD_VALIDATION_MESSAGE })
  newPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password cannot be empty' })
  confirmPassword!: string;
}

export class ForgotPasswordDto implements ForgotPasswordInterface {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;
}

export class ResetPasswordDto implements ResetPasswordInterface {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @Matches(REGEX.PASSWORD, { message: PASSWORD_VALIDATION_MESSAGE })
  newPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password cannot be empty' })
  confirmPassword!: string;
}

export class VerifyResetPinDto implements VerifyResetPinInterface {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'PIN cannot be empty' })
  pin!: string;

  @IsString()
  @Matches(REGEX.PASSWORD, { message: PASSWORD_VALIDATION_MESSAGE })
  newPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password cannot be empty' })
  confirmPassword!: string;
}
