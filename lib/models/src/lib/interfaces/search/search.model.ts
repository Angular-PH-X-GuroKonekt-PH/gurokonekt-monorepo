import { DaysInWeek, UserAvailabilityInterface } from '../user/user.model';

export interface MentorSearchItemInterface {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  email: string;
  country: string | null;
  timezone: string | null;
  language: string | null;
  isMentorApproved: boolean;
  isMentorProfileComplete: boolean;
  createdAt: Date;
  avatarAttachments: MenttorAttachmentSearch[];
  mentorProfiles: MentorProfileSearch[];
}

export interface MentorProfileSearch {
  id: string;
  title: string | null;
  areasOfExpertise: string[];
  yearsOfExperience: number | null;
  bio: string | null;
  skills: string[];
  sessionRate: number | null;
  availability: unknown;
  linkedInUrl: string | null;
  updatedAt: Date;
}

export interface MentorProfileDetailInterface {
  id: string;
  title: string | null;
  bio: string | null;
  areasOfExpertise: string[];
  yearsOfExperience: number | null;
  skills: string[];
  sessionRate: number | null;
  availability: unknown;
  linkedInUrl: string | null;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
    language: string | null;
    country: string | null;
    timezone: string | null;
    avatarAttachments: { publicUrl: string; fileName: string }[];
  };
}

export interface MenttorAttachmentSearch {
  publicUrl: string;
  fileName: string
}

export interface MentorSearchResultInterface {
  total: number;
  page: number;
  limit: number;
  results: MentorSearchItemInterface[];
}

export interface MentorRecommendationResultInterface {
  results: MentorSearchItemInterface[];
  /**
   * True when at least one returned mentor genuinely matched the mentee's
   * goals or interests. False when the whole set came from the newest-mentor
   * top-up, which the UI uses to switch its heading copy.
   */
  isPersonalized: boolean;
}

// Frontend-only types for the mentor search feature.
// Aligned to the backend SearchMentorDto (search-mentor.dto.ts).
//
// Fields marked PENDING BACKEND exist in the UI requirement but are not yet
// in SearchMentorDto. Add them to MentorSearchRequest + buildQueryParams()
// in the service once the backend exposes them.

export enum SearchSortBy {
  NEWEST = 'newest',
  SESSION_RATE = 'sessionRate',
  YEARS_EXPERIENCE = 'yearsExperience',
  NAME = 'name',
}

export enum SearchSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export type AvailabilityOption = DaysInWeek;

// Form state held by the MentorSearch component 
export interface MentorSearchFilter {
  // Supported by current DTO 
  name: string | null;
  skills: string[];       // UI: chip array - API: comma-separated string
  expertise: string[];       // UI: chip array - API: comma-separated string
  page: number;
  limit: number;
  availabilityDay: AvailabilityOption[];
  language: string | null;
  minYearsExperience: number | null;
  maxYearsExperience: number | null;
  minRating: number | null;        // PENDING BACKEND



}

// Request DTO sent to GET /mentors/search
// Mirrors SearchMentorDto exactly. Only add fields here once the backend supports them.
export interface MentorSearchRequest {
  page?: number;
  limit?: number;
  name?: string;
  skills?: string;        // comma-separated
  expertise?: string;        // comma-separated
  minSessionRate?: number;
  maxSessionRate?: number;
  minYearsExperience?: number;
  maxYearsExperience?: number;
  availabilityDay?: string;
  // minRating?: number;        // PENDING BACKEND
  language?: string;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  // TODO: uncomment once backend adds these to SearchMentorDto:
  // minRating?:       number;
  // availability?:    AvailabilityOption;
}
