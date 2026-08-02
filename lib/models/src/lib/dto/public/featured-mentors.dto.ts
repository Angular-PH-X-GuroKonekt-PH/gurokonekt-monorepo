import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const FEATURED_MENTORS_DEFAULT_LIMIT = 12;
export const FEATURED_MENTORS_MAX_LIMIT = 50;

export class FeaturedMentorsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(FEATURED_MENTORS_MAX_LIMIT)
  limit?: number;
}
