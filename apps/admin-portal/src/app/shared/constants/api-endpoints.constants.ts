export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
  },
  admin: {
    mentees: '/admin/mentees',
    menteeById: (id: string) => `/admin/mentees/${id}`,
    menteeActivate: (id: string) => `/admin/mentees/${id}/activate`,
    menteeDeactivate: (id: string) => `/admin/mentees/${id}/deactivate`,
    menteeReject: (id: string) => `/admin/mentees/${id}/reject`,
    menteeRejectionLog: (id: string) => `/admin/mentees/${id}/rejection-log`,
    menteeResendVerification: (id: string) => `/admin/mentees/${id}/resend-verification`,
    bookings: '/admin/bookings',
    bookingById: (id: string) => `/admin/bookings/${id}`,
    bookingForceCancel: (id: string) => `/admin/bookings/${id}/force-cancel`,
  },
} as const;
