import { IsString, IsEmail, IsBoolean, IsDate, IsOptional, IsArray, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MentorStatus, ProfileType, Weekday } from '../models';

export class TimeSlotDto {
  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '09:00'
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '12:00'
  })
  @IsString()
  endTime: string;
}

export class WeeklyAvailabilityDto {
  @ApiProperty({
    description: 'Day of the week',
    example: 'MONDAY',
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  })
  @IsEnum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
  day: Weekday;

  @ApiProperty({
    description: 'Time slots for the day',
    type: [TimeSlotDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  slots: TimeSlotDto[];
}

export class VerificationDocumentDto {
  @ApiProperty({
    description: 'Document ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Document file name',
    example: 'document.pdf'
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Document file URL',
    example: 'https://example.com/documents/document.pdf'
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: 'Document upload timestamp',
    example: '2025-12-03T10:00:00Z'
  })
  @IsDate()
  uploadedAt: Date;
}

export class MenteeProfileDto {
  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://example.com/images/profile.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Short biography',
    example: 'I am a student interested in technology.'
  })
  @IsString()
  shortBio: string;

  @ApiProperty({
    description: 'Learning goals',
    example: 'I want to learn web development and AI.'
  })
  @IsString()
  learningGoals: string;

  @ApiProperty({
    description: 'Areas of interest',
    example: ['Web Development', 'Artificial Intelligence']
  })
  @IsArray()
  areasOfInterest: string[];

  @ApiProperty({
    description: 'Preferred session type',
    example: 'online',
    enum: ['online', 'in-person']
  })
  @IsEnum(['online', 'in-person'])
  preferredSessionType: "online" | "in-person";

  @ApiProperty({
    description: 'Availability information',
    example: '{"monday": ["09:00-12:00"], "tuesday": ["14:00-17:00"]}',
    required: false
  })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiProperty({
    description: 'Whether the profile is completed',
    example: false
  })
  @IsBoolean()
  completed: boolean;
}

export class MentorProfileDto {
  @ApiProperty({
    description: 'Expertise areas',
    example: ['Web Development', 'Database Design']
  })
  @IsArray()
  expertiseAreas: string[];

  @ApiProperty({
    description: 'Years of experience',
    example: 5
  })
  @IsNumber()
  yearsOfExperience: number;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe'
  })
  @IsString()
  linkedInUrl: string;

  @ApiProperty({
    description: 'Verification documents',
    type: [VerificationDocumentDto]
  })
  @IsArray()
  verificationDocuments: VerificationDocumentDto[];

  @ApiProperty({
    description: 'Mentor status',
    example: 'ACTIVE',
    enum: MentorStatus
  })
  @IsEnum(MentorStatus)
  status: MentorStatus;

  @ApiProperty({
    description: 'Rejection reason (if rejected)',
    example: 'Insufficient experience',
    required: false
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://example.com/images/profile.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Professional biography',
    example: 'Senior software engineer with 5 years of experience.'
  })
  @IsString()
  professionalBio: string;

  @ApiProperty({
    description: 'Additional skills',
    example: ['Leadership', 'Project Management']
  })
  @IsArray()
  additionalSkills: string[];

  @ApiProperty({
    description: 'Session rate per hour',
    example: 50.0,
    required: false
  })
  @IsNumber()
  @IsOptional()
  sessionRate?: number;

  @ApiProperty({
    description: 'Weekly availability',
    type: [WeeklyAvailabilityDto]
  })
  @IsArray()
  availability: WeeklyAvailabilityDto[];

  @ApiProperty({
    description: 'Whether the profile is completed',
    example: true
  })
  @IsBoolean()
  isProfileCompleted: boolean;
}

export class UserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User middle name',
    example: 'Michael',
    required: false
  })
  @IsString()
  middleName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe'
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User extension name (e.g., Jr., Sr., III)',
    example: 'Jr.',
    required: false
  })
  @IsString()
  @IsOptional()
  extensionName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Hashed user password',
    example: '$2b$10$abcdefghijklmnopqrstuvwx'
  })
  @IsString()
  passwordHash: string;

  @ApiProperty({
    description: 'User country or timezone',
    example: 'UTC'
  })
  @IsString()
  countryOrTimezone: string;

  @ApiProperty({
    description: 'User preferred language',
    example: 'en',
    required: false
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiProperty({
    description: 'Whether the user has accepted terms',
    example: true
  })
  @IsBoolean()
  acceptedTerms: boolean;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: true
  })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2025-12-03T10:00:00Z',
    required: false
  })
  @IsDate()
  @IsOptional()
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-03T10:00:00Z'
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-12-03T10:00:00Z'
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    description: 'User profile',
    required: false,
    type: Object
  })
  @IsOptional()
  profile: MenteeProfileDto | MentorProfileDto | null;

  @ApiProperty({
    description: 'User profile type',
    example: ProfileType.MENTEE,
    required: false,
    enum: ProfileType,
  })
  @IsString()
  @IsOptional()
  profileType?: ProfileType;

  @ApiProperty({
    description: 'Whether the user is archived',
    example: false
  })
  @IsBoolean()
  isArchived: boolean;

  @ApiProperty({
    description: 'Archived timestamp',
    example: '2025-12-03T10:00:00Z',
    required: false
  })
  @IsDate()
  @IsOptional()
  archivedAt?: Date;
}