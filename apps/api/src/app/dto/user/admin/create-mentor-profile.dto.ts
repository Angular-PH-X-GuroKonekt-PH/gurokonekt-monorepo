import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMentorProfileDto {
  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  skills: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sessionRate?: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  availability: string[];
}
