import { Role } from './user.types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isProfileComplete: boolean;
  isMentorProfileComplete: boolean;
}
