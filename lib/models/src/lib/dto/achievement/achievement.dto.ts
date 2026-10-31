import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ACHIEVEMENT_COLORS,
  ACHIEVEMENT_ICONS,
  AchievementAwardType,
  AchievementMetric,
  MentorAchievementStatus,
} from '../../interfaces/achievement/achievement.model';

/** Multipart forms send booleans as strings. */
const toBoolean = ({ value }: { value: unknown }) => value === true || value === 'true';
/** Multipart forms send empty fields as ''. */
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);

export class AchievementCriterionDto {
  @IsEnum(AchievementMetric)
  metric!: AchievementMetric;

  @IsNumber()
  @Min(0)
  min!: number;
}

export class CreateAchievementDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @IsIn(ACHIEVEMENT_ICONS as readonly string[])
  icon!: string;

  @IsIn(ACHIEVEMENT_COLORS as readonly string[])
  color!: string;

  @IsEnum(AchievementAwardType)
  awardType!: AchievementAwardType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requirements?: string;

  @IsOptional()
  @IsBoolean()
  requiresProof?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => AchievementCriterionDto)
  criteria?: AchievementCriterionDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  validityMonths?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAchievementDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(ACHIEVEMENT_ICONS as readonly string[])
  icon?: string;

  @IsOptional()
  @IsIn(ACHIEVEMENT_COLORS as readonly string[])
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requirements?: string | null;

  @IsOptional()
  @IsBoolean()
  requiresProof?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => AchievementCriterionDto)
  criteria?: AchievementCriterionDto[];

  /** null clears it (badge never expires). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  validityMonths?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Mentor applying for (or updating) an application achievement. Sent as multipart. */
export class ApplyAchievementDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(300)
  details?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  earnedAt?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  expiresAt?: string;

  /** Update only: keep the proof already on file when no new file is sent. */
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  keepProof?: boolean;
}

export class ReviewAchievementDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ListAchievementSubmissionsQueryDto {
  @IsOptional()
  @IsEnum(MentorAchievementStatus)
  status?: MentorAchievementStatus;
}
