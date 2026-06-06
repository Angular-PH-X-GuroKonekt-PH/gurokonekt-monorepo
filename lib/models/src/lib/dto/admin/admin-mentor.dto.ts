import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListMentorsQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'inactive', 'all'])
  status?: 'pending' | 'approved' | 'rejected' | 'inactive' | 'all';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'firstName', 'lastName'])
  sortBy?: 'createdAt' | 'firstName' | 'lastName';

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
