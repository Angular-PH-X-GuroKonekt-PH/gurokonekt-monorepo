import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SignInWithOAth, SignUpOptionsInterface, SignInWithOAthProviders } from '@gurokonekt/models';

class OAuthOptionsDto implements SignUpOptionsInterface {
  @ApiProperty({ example: 'https://example.com/welcome' })
  emailRedirectTo: string;
}

export class SignInWithOAuthDto implements SignInWithOAth {
  @ApiProperty({ enum: SignInWithOAthProviders })
  @IsEnum(SignInWithOAthProviders)
  provider: SignInWithOAthProviders;

  @ApiProperty({ required: false, type: OAuthOptionsDto })
  @IsOptional()
  options: OAuthOptionsDto | null;
}
