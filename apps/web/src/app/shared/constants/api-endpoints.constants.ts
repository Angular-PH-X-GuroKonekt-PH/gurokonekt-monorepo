export const API_ENDPOINTS = {
  auth: {
    registerMentee: '/auth/register-mentee',
    registerMentor: '/auth/register-mentor',
    login: '/auth/login',
    verifyEmail: '/auth/verify-email',
    resendConfirmation: '/auth/resend-confirmation-link',
  },
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
  },
} as const;