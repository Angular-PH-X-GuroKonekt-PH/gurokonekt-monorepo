import { UserStatus } from '../user/user.model';

export interface AdminMenteeListItemInterface {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  status: UserStatus;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

export interface AdminMenteeDetailInterface extends AdminMenteeListItemInterface {
  language: string | null;
  timezone: string | null;
  menteeProfile: {
    id: string;
    bio: string | null;
    learningGoals: string[];
    areasOfInterest: string[];
    preferredSessionType: string | null;
  } | null;
}

export interface AdminMenteeListResponseInterface {
  data: AdminMenteeListItemInterface[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminRejectionLogInterface {
  id: string;
  menteeId: string;
  adminId: string;
  reason: string;
  createdAt: string;
}
