import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  extensionName?: string;

  @IsString()
  countryOrTimezone: string;

  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @IsBoolean()
  acceptedTerms: boolean;
}
