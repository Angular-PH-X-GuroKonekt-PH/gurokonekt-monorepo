import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GoogleRegistrationTokensInterface } from '../../interfaces/auth/signin.model';
import { RegisterMenteeDto } from './signup-mentee.dto';
import { RegisterMentorDto } from './signup-mentor.dto';

// Google registrations take the email from the verified Google account and
// have no password, so those fields are dropped from the regular DTOs.
const GOOGLE_MANAGED_FIELDS = ['email', 'password', 'confirmPassword', 'emailRedirectTo'] as const;

export class RegisterMenteeWithGoogleDto
  extends OmitType(RegisterMenteeDto, GOOGLE_MANAGED_FIELDS)
  implements GoogleRegistrationTokensInterface
{
  @ApiProperty({ description: 'registration.registrationToken from POST /auth/signin/google' })
  @IsString()
  @IsNotEmpty()
  registrationToken!: string;

  @ApiProperty({ required: false, description: 'registration.refreshToken from POST /auth/signin/google' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class RegisterMentorWithGoogleDto
  extends OmitType(RegisterMentorDto, GOOGLE_MANAGED_FIELDS)
  implements GoogleRegistrationTokensInterface
{
  @ApiProperty({ description: 'registration.registrationToken from POST /auth/signin/google' })
  @IsString()
  @IsNotEmpty()
  registrationToken!: string;

  @ApiProperty({ required: false, description: 'registration.refreshToken from POST /auth/signin/google' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
