import { Role } from './user.types';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
  };
  accessToken: string;
  token?: string; 
  message: string;
}