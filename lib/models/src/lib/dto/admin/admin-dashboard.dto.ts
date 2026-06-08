import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
