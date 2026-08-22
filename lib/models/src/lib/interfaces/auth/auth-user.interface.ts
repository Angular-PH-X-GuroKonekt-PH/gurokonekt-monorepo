import { Role } from './user.types';
import { UserStatus } from '../user/user.model';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status?: UserStatus;
  isProfileComplete: boolean;
  isMentorProfileComplete: boolean;
}
