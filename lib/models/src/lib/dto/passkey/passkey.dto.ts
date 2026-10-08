import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { RenamePasskeyInterface, VerifyPasskeyRegistrationInterface } from '../../interfaces/passkey/passkey.model';

export class VerifyPasskeyRegistrationDto implements VerifyPasskeyRegistrationInterface {
  @ApiProperty({
    description: 'The WebAuthn registration response from the browser (RegistrationResponseJSON).',
    example: { id: 'base64url-credential-id', rawId: 'base64url-credential-id', type: 'public-key', response: {} },
  })
  @IsObject()
  @IsNotEmptyObject()
  response!: Record<string, unknown>;

  @ApiProperty({ required: false, example: 'Chrome on Windows', description: 'Friendly label for the passkey.' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}

export class RenamePasskeyDto implements RenamePasskeyInterface {
  @ApiProperty({ example: 'Work laptop', description: 'New label for the passkey (1-60 characters).' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Passkey name cannot be empty' })
  @MaxLength(60)
  name!: string;
}
