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
    mentors: '/admin/mentors',
    mentorById: (id: string) => `/admin/mentors/${id}`,
    mentorRejectionLog: (id: string) => `/admin/mentors/${id}/rejection-log`,
    mentorDeactivationFeedback: (id: string) => `/admin/mentors/${id}/deactivation-feedback`,
    approveMentor: (id: string) => `/admin/mentors/${id}/approve`,
    rejectMentor: (id: string) => `/admin/mentors/${id}/reject`,
    deactivateMentor: (id: string) => `/admin/mentors/${id}/deactivate`,
    bookings: '/admin/bookings',
    bookingById: (id: string) => `/admin/bookings/${id}`,
    bookingForceCancel: (id: string) => `/admin/bookings/${id}/force-cancel`,
  },
} as const;
