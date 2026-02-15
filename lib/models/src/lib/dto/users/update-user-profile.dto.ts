import { API_RESPONSE, REGEX, SWAGGER_DOCUMENTATION } from '../../interfaces/contants/contants.const';
import { DaysInWeek, MenteePreferredSessionType, UpdateMenteeProfileInterface, TimeFrameInterface, UserAvailabilityInterface, UpdateMentorProfileInterface } from '../../interfaces/user/user.model';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { 
  IsString, 
  IsArray, 
  IsEnum, 
  IsUUID, 
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  Matches
} from 'class-validator';

export class TimeFrameDto implements TimeFrameInterface {
  @ApiProperty({
    description: 'Start time (24h format)',
    example: '07:00'
  })
  @IsString()
  from!: string;

  @ApiProperty({
    description: 'End time (24h format)',
    example: '09:00'
  })
  @IsString()
  to!: string;
}

export class UserAvailabilityDto implements UserAvailabilityInterface{
  @ApiProperty({
    description: 'Day of the week',
    enum: DaysInWeek,
    example: DaysInWeek.Monday
  })
  @IsEnum(DaysInWeek)
  day!: DaysInWeek;

  @ApiProperty({
    description: 'List of available time frames for the day',
    type: [TimeFrameDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeFrameDto)
  timeFrames!: TimeFrameDto[];
}

export class UpdateMenteeProfileDto implements Partial<UpdateMenteeProfileInterface> { 
  @ApiPropertyOptional({
    example: SWAGGER_DOCUMENTATION.MENTEE_BIO.example,
    description: SWAGGER_DOCUMENTATION.MENTEE_BIO.description
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    example: SWAGGER_DOCUMENTATION.PHONE_NUMBER.example,
    description: SWAGGER_DOCUMENTATION.PHONE_NUMBER.description
  })
  @IsString()
  @Matches(REGEX.PHONE, { message: API_RESPONSE.ERROR.INVALID_PHONE_FORMAT.message })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: SWAGGER_DOCUMENTATION.COUNTRY.example,
    description: SWAGGER_DOCUMENTATION.COUNTRY.description
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  learningGoals?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  areasOfInterest?: string[];

  @ApiPropertyOptional({ enum: MenteePreferredSessionType })
  @IsEnum(MenteePreferredSessionType)
  @IsOptional()
  preferredSessionType?: MenteePreferredSessionType;

  @ApiPropertyOptional({ type: [UserAvailabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityDto)
  @IsOptional()
  availability?: UserAvailabilityDto[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  updatedById?: string;
}


export class UpdateMentorProfileDto implements Partial<UpdateMentorProfileInterface> {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @Matches(REGEX.PHONE)
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : JSON.parse(value || '[]'))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  areasOfExpertise?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  sessionRate?: number;

  @ApiPropertyOptional({ type: [UserAvailabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityDto)
  @IsOptional()
  availability?: UserAvailabilityDto[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  updatedById?: string;
}

