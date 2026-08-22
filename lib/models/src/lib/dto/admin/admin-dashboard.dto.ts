import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GetGrowthChartQueryDto {
  @IsOptional()
  @IsEnum(['registrations', 'bookings', 'all'])
  metric?: 'registrations' | 'bookings' | 'all';

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'annually'])
  period?: 'daily' | 'weekly' | 'monthly' | 'annually';

  @IsOptional()
  @IsIn(['7d', '30d', '3m', '6m', '12m'])
  window?: '7d' | '30d' | '3m' | '6m' | '12m';
}

export class BroadcastAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @IsEnum(['mentor', 'mentee', 'all'])
  targetRole?: 'mentor' | 'mentee' | 'all';
}

export class ListAnnouncementsQueryDto {
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
  @IsEnum(['createdAt', 'title', 'recipientCount'])
  sortBy?: 'createdAt' | 'title' | 'recipientCount';

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
