import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListMentorsQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'inactive', 'all'])
  status?: 'pending' | 'approved' | 'rejected' | 'inactive' | 'all';

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

  /**
   * Filter by featured status. `@Transform` rather than `@Type(() => Boolean)`
   * because `Boolean('false')` is `true`, which would silently turn the
   * "not featured" filter into "featured".
   */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsEnum(['createdAt', 'firstName', 'lastName', 'email', 'status'])
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email' | 'status';

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

export class AdminRejectMentorDto {
  @IsNotEmpty()
  @IsString()
  reason!: string;
}

export class SetMentorFeaturedDto {
  @IsBoolean()
  isFeatured!: boolean;
}
