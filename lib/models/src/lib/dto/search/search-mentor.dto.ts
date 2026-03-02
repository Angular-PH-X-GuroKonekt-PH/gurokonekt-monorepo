import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum SearchSortBy {
  NEWEST = 'newest',
  SESSION_RATE = 'sessionRate',
  YEARS_EXPERIENCE = 'yearsExperience',
  NAME = 'name',
}

export enum SearchSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchMentorDto {
  @ApiPropertyOptional({
    description: 'Partial name search (first or last name, case-insensitive)',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of skills to filter by',
    example: 'TypeScript,Node.js,React',
  })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of expertise areas to filter by',
    example: 'Web Development,Backend Engineering',
  })
  @IsOptional()
  @IsString()
  expertise?: string;

  @ApiPropertyOptional({
    description: 'Minimum session rate (USD)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSessionRate?: number;

  @ApiPropertyOptional({
    description: 'Maximum session rate (USD)',
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxSessionRate?: number;

  @ApiPropertyOptional({
    description: 'Minimum years of experience',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minYearsExperience?: number;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of results per page (max 50)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    enum: SearchSortBy,
    description: 'Field to sort results by',
    default: SearchSortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sortBy?: SearchSortBy;

  @ApiPropertyOptional({
    enum: SearchSortOrder,
    description: 'Sort direction',
    default: SearchSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SearchSortOrder)
  sortOrder?: SearchSortOrder;

  // ── Parsed helpers (populated by service, not from query) ──

  /** Parsed skills array from comma-separated `skills` query param. */
  get skillsArray(): string[] {
    return this.skills
      ? this.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  }

  /** Parsed expertise array from comma-separated `expertise` query param. */
  get expertiseArray(): string[] {
    return this.expertise
      ? this.expertise.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  }
}
