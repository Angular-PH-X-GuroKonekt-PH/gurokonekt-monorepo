import { Role } from './user.types';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
  };
  token?: string;
  message: string;
}