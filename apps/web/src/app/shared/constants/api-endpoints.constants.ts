export const API_ENDPOINTS = {
  auth: {
    registerMentee: '/auth/register-mentee',
    registerMentor: '/auth/register-mentor',
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    session: '/auth/session',
    verifyEmail: '/auth/verify-email',
    resendConfirmation: '/auth/resend-confirmation-link',
    forgotPassword: '/auth/forgot-password',
    completePasswordReset: '/auth/complete-password-reset',
  },
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
    dashboard: (userId: string) => `/user/${userId}/dashboard`,
    initiateDeactivation: (userId: string) => `/user/${userId}/deactivate/initiate`,
    verifyDeactivation: '/user/deactivate/verify',
    submitDeactivationFeedback: (userId: string) => `/user/${userId}/deactivate/feedback`,
    activateAccount: (userId: string) => `/user/${userId}/activate`,
  },
} as const;
