import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BadgeCategory, BadgeRarity, BadgeRequirementType } from '../../interfaces/badge/badge.model';

export const MAX_FEATURED_BADGES = 3;

export class SetFeaturedBadgesDto {
  @ApiProperty({ type: [String], description: `Up to ${MAX_FEATURED_BADGES} unlocked badge IDs. Replaces the current selection; send [] to clear.` })
  @IsArray()
  @ArrayMaxSize(MAX_FEATURED_BADGES)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  badgeIds!: string[];
}

export class ListBadgesQueryDto {
  @ApiPropertyOptional({ enum: BadgeCategory })
  @IsOptional()
  @IsEnum(BadgeCategory)
  category?: BadgeCategory;
}

export class UpdateBadgeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ enum: BadgeCategory })
  @IsOptional()
  @IsEnum(BadgeCategory)
  category?: BadgeCategory;

  @ApiPropertyOptional({ enum: BadgeRarity })
  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @ApiPropertyOptional({ enum: BadgeRequirementType })
  @IsOptional()
  @IsEnum(BadgeRequirementType)
  requirementType?: BadgeRequirementType;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  requirementValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AwardBadgeDto {
  @ApiProperty()
  @IsUUID('all')
  userId!: string;
}
