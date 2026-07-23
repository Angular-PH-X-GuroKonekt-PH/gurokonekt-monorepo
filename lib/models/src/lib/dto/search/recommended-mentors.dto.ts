import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  DEFAULT_RECOMMENDED_MENTOR_LIMIT,
  MAX_RECOMMENDED_MENTOR_LIMIT,
} from '../../interfaces/search/search.model';

export class RecommendedMentorsDto {
  @ApiPropertyOptional({
    description: 'Number of mentors to recommend',
    example: DEFAULT_RECOMMENDED_MENTOR_LIMIT,
    default: DEFAULT_RECOMMENDED_MENTOR_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RECOMMENDED_MENTOR_LIMIT)
  limit?: number;
}
