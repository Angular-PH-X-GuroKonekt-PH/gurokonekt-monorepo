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

// Flat shape consumed by BookMentorCard.
// Produced by toFlatCard() in find-mentors.ts which flattens the nested
// MentorSearchItemInterface returned by the API.
//
// Fields marked PENDING BACKEND are included in the dummy data but not yet
// exposed by the backend. Remove the comment once the backend adds them
// to MentorProfileSearch.
export interface FlatMentorCard {
  id: string;
  fullName: string;
  avatarUrl: string;
  tagline: string;
  bio: string;
  skills: string[];
  expertise: string[];
  rating: number;        // PENDING BACKEND
  reviewCount: number;        // PENDING BACKEND
  availability: string;        // PENDING BACKEND
  sessionRate: number | null;
  yearsOfExperience: number | null;
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

export type AvailabilityOption = 'today' | 'this_week' | 'this_month';

// Form state held by the MentorSearch component 
export interface MentorSearchFilter {
  // Supported by current DTO 
  name: string | null;
  skills: string[];       // UI: chip array - API: comma-separated string
  expertise: string[];       // UI: chip array - API: comma-separated string
  minSessionRate: number | null;
  maxSessionRate: number | null;
  minYearsExperience: number | null;
  sortBy: SearchSortBy | null;
  sortOrder: SearchSortOrder | null;
  page: number;
  limit: number;

  // PENDING BACKEND — filtered locally in dummy mode only
  minRating: number | null;
  availability: AvailabilityOption | null;
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
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  // TODO: uncomment once backend adds these to SearchMentorDto:
  // minRating?:       number;
  // availability?:    AvailabilityOption;
}