import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { ResendEmailSignUpConfirmation, ResendEmailChangeEmail, SignUpOptionsInterface } from '@gurokonekt/models';

class EmailOptionsDto implements SignUpOptionsInterface {
  @ApiProperty({ example: 'https://example.com/welcome' })
  emailRedirectTo: string;
}

export class ResendSignUpDto implements ResendEmailSignUpConfirmation {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, type: EmailOptionsDto })
  @IsOptional()
  options: EmailOptionsDto | null;
}

export class ResendChangeEmailDto implements ResendEmailChangeEmail {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;
}
