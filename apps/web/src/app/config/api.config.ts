import { environment } from '../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    auth: {
      registerMentee: '/auth/register-mentee',
      registerMentor: '/auth/register-mentor',
      login: '/auth/login',
      verifyEmail: '/auth/verify-email',
    },
    user: {
      profile: '/user/profile',
      updateProfile: '/user/profile',
    },
  },
} as const;

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};