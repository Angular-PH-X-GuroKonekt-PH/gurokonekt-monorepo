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
