import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';
import { SignUpInputInterface, SignUpOptionsInterface } from '@gurokonekt/models';

class SignUpOptionsDto implements SignUpOptionsInterface {
  @ApiProperty({ example: 'https://example.com/welcome' })
  @IsString()
  emailRedirectTo: string;
}

export class SignUpDto implements SignUpInputInterface {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;

  @ApiProperty({ required: false, type: SignUpOptionsDto })
  @IsOptional()
  options: SignUpOptionsDto | null;
}
