import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Supabase only lets users change their own identities, so the user's session is needed. */
export class DisconnectGoogleDto {
  @ApiProperty({ description: "The signed-in user's refresh token." })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ConnectGoogleDto extends DisconnectGoogleDto {
  @ApiProperty({ description: 'Google ID token (credential) from the Google Sign-In button.' })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiProperty({ required: false, description: 'Raw nonce given to the Google button, if any.' })
  @IsOptional()
  @IsString()
  nonce?: string;
}
