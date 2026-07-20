export const API_ENDPOINTS = {
  auth: {
    registerMentee: '/auth/register-mentee',
    registerMentor: '/auth/register-mentor',
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    verifyEmail: '/auth/verify-email',
    resendConfirmation: '/auth/resend-confirmation-link',
    forgotPassword: '/auth/forgot-password',
    completePasswordReset: '/auth/complete-password-reset',
  },
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
  },
} as const;
