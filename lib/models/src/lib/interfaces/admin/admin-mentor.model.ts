import { UserStatus } from '../user/user.model';

export interface AdminMentorListItemInterface {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  status: UserStatus;
  isMentorApproved: boolean;
  isMentorProfileComplete: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

export interface AdminMentorDetailInterface extends AdminMentorListItemInterface {
  phoneNumber: string | null;
  country: string | null;
  language: string | null;
  timezone: string | null;
  mentorProfile: {
    id: string;
    title: string | null;
    areasOfExpertise: string[];
    yearsOfExperience: number | null;
    linkedInUrl: string | null;
    bio: string | null;
    skills: string[];
    sessionRate: number | null;
    availability: unknown;
  } | null;
  documentAttachments: {
    id: string;
    publicUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
}

export interface AdminMentorListResponseInterface {
  data: AdminMentorListItemInterface[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminMentorRejectionLogInterface {
  id: string;
  mentorId: string;
  adminId: string;
  reason: string;
  createdAt: string;
}
