import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, Matches } from 'class-validator';
import { REGEX } from '../../interfaces/contants/contants.const';
import { CustomMatch } from '../decorators/custom-matches.decorator';

export class UpdateAuthenticationSettingsDto {
  @ApiProperty({ example: true, description: 'Every account must add at least one passkey.' })
  @IsBoolean()
  passkeyRequired!: boolean;

  @ApiProperty({ example: true, description: 'Every account must connect a Google account.' })
  @IsBoolean()
  googleIdpRequired!: boolean;
}

/** For accounts created with Google, which have no password yet. */
export class SetPasswordDto {
  @ApiProperty({ example: 'Str0ng!Passw0rd' })
  @IsString()
  @Matches(REGEX.PASSWORD, {
    message: 'Password must be minimum 8 characters, include uppercase, lowercase, number, and symbol',
  })
  newPassword!: string;

  @ApiProperty({ example: 'Str0ng!Passw0rd' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password cannot be empty' })
  @CustomMatch('newPassword', { message: 'Passwords do not match' })
  confirmPassword!: string;
}
