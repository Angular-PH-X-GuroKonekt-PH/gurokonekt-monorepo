import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for the public contact form.
 *
 * The min lengths mirror the landing page form's validators so client and server
 * cannot drift. The max lengths exist only on the server: the form has none, but
 * an unauthenticated write endpoint has to bound what it will store.
 */
export class CreateInquiryDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  topic!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  /** Google reCAPTCHA v3 token. Verified server-side, never persisted. */
  @IsString()
  @IsNotEmpty()
  recaptchaToken!: string;
}

export class ListInquiriesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'fullName', 'email', 'topic'])
  sortBy?: 'createdAt' | 'fullName' | 'email' | 'topic';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
