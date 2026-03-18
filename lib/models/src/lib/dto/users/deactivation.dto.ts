import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitiateDeactivationDto {
  @ApiProperty({ description: 'Current account password for verification' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyDeactivationTokenDto {
  @ApiProperty({ description: 'Deactivation token from the email link' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class DeactivationFeedbackDto {
  @ApiProperty({ description: 'Token from deactivation email link (final validation)' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Reason for deactivating the account' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
