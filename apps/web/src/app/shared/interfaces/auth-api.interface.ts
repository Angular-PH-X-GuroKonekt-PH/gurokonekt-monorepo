import type { ApiResponse } from './api-response.interface';

export interface LoginApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isProfileComplete?: boolean;
  isMentorProfileComplete?: boolean;
}

export interface LoginApiSession {
  access_token: string;
  refresh_token?: string;
}

export interface LoginApiAuthPayload {
  user?: LoginApiUser;
  session?: LoginApiSession;
}

export interface RefreshTokenApiData {
  accessToken: string;
  refreshToken: string;
}

export type RefreshTokenApiResponse = ApiResponse<RefreshTokenApiData>;

export interface LoginApiData {
  user?: LoginApiUser;
  session?: LoginApiSession;
  accessToken?: string;
  refreshToken?: string;
  auth?: LoginApiAuthPayload;
}

export type LoginApiResponse = ApiResponse<LoginApiData>;