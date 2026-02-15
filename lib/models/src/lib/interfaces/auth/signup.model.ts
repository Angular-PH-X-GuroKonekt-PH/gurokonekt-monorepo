export type { RegisterMenteeRequest } from './register-mentee-request.interface';
export type { RegisterMentorRequest } from './register-mentor-request.interface';
export type { LoginRequest } from './login-request.interface';
export type { ApiResponse } from './api-response.interface';
export type { AuthResponse } from './auth-response.interface';
export type { Role, Step } from './user.types';
export interface RegisterMenteeInterface {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  language: string;
  timezone: string;
  phoneNumber: string;
}

export interface RegisterMentorInterface {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  language: string;
  timezone: string;
  phoneNumber: string;
  yearsOfExperience: number;
  linkedInUrl?: string;
  areasOfExpertise: string[];
}
