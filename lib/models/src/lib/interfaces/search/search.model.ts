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
  areasOfExpertise: string[];
  yearsOfExperience: number | null;
  bio: string | null;
  skills: string[];
  sessionRate: number | null;
  availability: unknown;
  linkedInUrl: string | null;
  updatedAt: Date;
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
