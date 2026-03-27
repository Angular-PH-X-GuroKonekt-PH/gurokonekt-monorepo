export const API_RESPONSE = {
  SUCCESS: {
    /**
     * SERVICES
     * */ 
    SUPABASE_SERVICE: {
      code: 200,
      message: 'Supabase service executed successfully',
    },
    PRISMA_SERVICE: {
      code: 200,
      message: 'Database service executed successfully',
    },

    /**
     * AUTH
     * */ 
    REGISTER_MENTEE: {
      code: 201,
      message: 'Mentee registered successfully',
    },
    REGISTER_MENTOR: {
      code: 201,
      message: 'Mentor registered successfully',
    },
    SIGN_WITH_OATH: {
      code: 200,
      message: 'Signed in with OAuth successfully',
    },
    SIGN_WITH_PASSWORD: {
      code: 200,
      message: 'Signed in with password successfully',
    },
    UPDATE_PASSWORD: {
      code: 200,
      message: 'Your password has been updated!',
    },
    FORGOT_PASSWORD_EMAIL_SENT: {
      code: 200,
      message: 'Password reset link sent to your email',
    },
    RESET_PASSWORD_PIN_SENT: {
      code: 200,
      message: 'PIN code sent to your email',
    },
    SIGN_OUT: {
      code: 200,
      message: 'Signed out successfully',
    },
    CONFIRMATION_EMAIL_SENT: {
      code: 200,
      message: 'Confirmation email sent successfully',
    },

    UPLOAD_FILES: {
      code: 200,
      message: 'Files uploaded successfully',
    },
    UPLOAD_AVATAR: {
      code: 200,
      message: 'Avatar uploaded successfully',
    },

    UPDATE_USER_STATUS: {
      code: 200,
      message: 'User status updated successfully',
    },
    UPDATE_USER_ROLE: {
      code: 200,
      message: 'User role updated successfully',
    },
    UPDATE_USER_PROFILE: {
      code: 200,
      message: 'User profile updated successfully',
    },
    GET_USER_PROFILE: {
      code: 200,
      message: 'User profile get successfully',
    },
    GET_MENTOR_DASHBOARD: {
      code: 200,
      message: 'Mentor dashboard data retrieved successfully',
    },
    GET_MENTEE_DASHBOARD: {
      code: 200,
      message: 'Mentee dashboard data retrieved successfully',
    },
    GET_MENTEE_BOOKING_OVERVIEW: {
      code: 200,
      message: 'Mentee booking overview retrieved successfully',
    },

    /**
     * NOTIFICATIONS
     */
    CREATE_NOTIFICATION: {
      code: 201,
      message: 'Notification created successfully',
    },
    GET_NOTIFICATIONS: {
      code: 200,
      message: 'Notifications retrieved successfully',
    },
    GET_NOTIFICATION: {
      code: 200,
      message: 'Notification retrieved successfully',
    },
    UPDATE_NOTIFICATION: {
      code: 200,
      message: 'Notification updated successfully',
    },
    DELETE_NOTIFICATION: {
      code: 200,
      message: 'Notification deleted successfully',
    },

    /**
     * BOOKINGS
     */
    CREATE_BOOKING: {
      code: 201,
      message: 'Booking created successfully',
    },
    GET_BOOKINGS: {
      code: 200,
      message: 'Bookings retrieved successfully',
    },
    GET_BOOKING: {
      code: 200,
      message: 'Booking retrieved successfully',
    },
    UPDATE_BOOKING: {
      code: 200,
      message: 'Booking updated successfully',
    },
    DELETE_BOOKING: {
      code: 200,
      message: 'Booking deleted successfully',
    },
    GET_MENTOR_BOOKINGS: {
      code: 200,
      message: 'Mentor bookings retrieved successfully',
    },
    APPROVE_BOOKING: {
      code: 200,
      message: 'Booking approved successfully',
    },
    REJECT_BOOKING: {
      code: 200,
      message: 'Booking rejected successfully',
    },
    COMPLETE_BOOKING: {
      code: 200,
      message: 'Session marked as completed',
    },

    /**
     * ACCOUNT DEACTIVATION
     */
    DEACTIVATION_INITIATED: {
      code: 200,
      message: 'Deactivation confirmation email sent',
    },
    DEACTIVATION_TOKEN_VALID: {
      code: 200,
      message: 'Deactivation token is valid',
    },
    ACCOUNT_DEACTIVATED: {
      code: 200,
      message: 'Account deactivated successfully',
    },

    /**
     * MENTOR DOWNGRADE
     */
    MENTOR_DOWNGRADED: {
      code: 200,
      message: 'Mentor account successfully downgraded to mentee',
    },

    /**
     * AVAILABILITY MANAGEMENT
     */
    GET_AVAILABILITY: {
      code: 200,
      message: 'Availability schedule retrieved successfully',
    },
    UPDATE_AVAILABILITY: {
      code: 200,
      message: 'Availability schedule updated successfully',
    },
    ADD_AVAILABILITY_SLOT: {
      code: 200,
      message: 'Availability slot added successfully',
    },
    DELETE_AVAILABILITY_SLOT: {
      code: 200,
      message: 'Availability slot deleted successfully',
    },
    UPDATE_SESSION_DURATION: {
      code: 200,
      message: 'Session duration updated successfully',
    },
  },
  ERROR: {
    /**
     * SERVICES
     * */ 
    SUPABASE_SERVICE: {
      code: 500,
      message: 'Supabase service error',
    },
    SUPABASE_CREDENTIALS_NOT_FOUND: {
      code: 500,
      message: 'Supabase credentials not found',
    },
    PRISMA_SERVICE: {
      code: 500,
      message: 'Database service error',
    },

    /**
     * AUTH
     * */ 
    REGISTER_MENTEE: {
      code: 500,
      message: 'Failed to register mentee',
    },
    REGISTER_MENTOR: {
      code: 500,
      message: 'Failed to register mentor',
    },
    USER_ALREADY_EXISTS: {
      code: 409,
      message: 'User already exists',
    },
    PHONE_NUMBER_ALREADY_EXISTS: {
      code: 409,
      message: 'Phone number already exists',
    },
    USER_NOT_FOUND: {
      code: 404,
      message: 'User not found',
    },
    EMAIL_ALREADY_CONFIRMED: {
      code: 400,
      message: 'Email address is already confirmed',
    },
    SIGNIN_ATTEMPT_INVALID_CREDENTIALS: {
      code: 401,
      message: 'Invalid login credentials',
    },
    SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED: {
      code: 403,
      message: 'Email address is not verified',
    },
    SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS: {
      code: 429,
      message: 'Too many failed login attempts. Try again later.',
    },
    PASSWORD_INCORRECT: {
      code: 401,
      message: 'Password incorrect',
    },
    UPDATE_PASSWORD_TOO_MANY_ATTEMPTS: {
      code: 429,
      message: 'Too many incorrect password attempts. Try again later.',
    },
    UPDATE_PASSWORD: {
      code: 400,
      message: 'Failed to update password',
    },
    RESET_PIN_INVALID: {
      code: 400,
      message: 'Invalid or expired PIN code',
    },
    RESET_PASSWORD: {
      code: 400,
      message: 'Failed to reset password',
    },
    PASSWORD_REGEX_MISMATCH: {
      code: 400,
      message: 'Password must be minimum 8 characters, include uppercase, lowercase, number, and symbol',
    },
    PASSWORD_MISMATCH: {
      code: 400,
      message: 'Password and confirm password must match',
    },
    INVALID_PHONE_FORMAT: {
      code: 400,
      message: 'Invalid phone number format',
    },
    INVALID_URL: {
      code: 400,
      message: 'Invalid URL',
    },
    NO_DATA_RETURNED_ON_AUTH: {
      code: 400,
      message: 'Authentication service did not return user ID',
    },

    /**
     * STORAGE
     * */ 
    UNSUPPORTED_FILE_TYPE: {
      code: 400,
      message: 'Unsupported file type',
    },
    INVALID_BUCKET_NAME: {
      code: 400,
      message: 'Invalid or missing bucket name',
    },
    UPLOAD_FILES:{
      code: 400,
      message: 'Error uploading file, please try again',
    },
    UPLOAD_AVATAR:{
      code: 400,
      message: 'Error uploading avatar, please try again',
    },

    MISSING_REQUIRED_FIELDS: {
      code: 400,
      message: 'Missing required fields',
    },
    INTERNAL_SERVER_ERROR: {
      code: 500,
      message: 'Internal server error',
    },
    TOO_MANY_REQUESTS: {
      code: 429,
      message: 'Too many requests. Please try again later',
    },

    UPDATE_USER_STATUS: {
      code: 400,
      message: 'Failed to update user status',
    },
    UPDATE_USER_ROLE: {
      code: 400,
      message: 'Failed to update user role',
    },
    UPDATE_USER_PROFILE: {
      code: 400,
      message: 'Failed to update user profile',
    },
    GET_USER_PROFILE: {
      code: 400,
      message: 'Failed to get user profile',
    },
    GET_MENTOR_DASHBOARD: {
      code: 500,
      message: 'Failed to get mentor dashboard data',
    },
    MENTOR_NOT_APPROVED: {
      code: 403,
      message: 'Access denied: mentor account is not verified or approved',
    },
    MENTOR_PROFILE_INCOMPLETE: {
      code: 403,
      message: 'Access denied: mentor profile is not complete',
    },
    GET_MENTEE_DASHBOARD: {
      code: 500,
      message: 'Failed to get mentee dashboard data',
    },
    GET_MENTEE_BOOKING_OVERVIEW: {
      code: 500,
      message: 'Failed to get mentee booking overview',
    },
    MENTEE_ACCESS_DENIED: {
      code: 403,
      message: 'Access denied: account does not have mentee privileges',
    },

    /**
     * NOTIFICATIONS
     */
    CREATE_NOTIFICATION: {
      code: 500,
      message: 'Failed to create notification',
    },
    GET_NOTIFICATIONS: {
      code: 500,
      message: 'Failed to get notifications',
    },
    GET_NOTIFICATION: {
      code: 500,
      message: 'Failed to get notification',
    },
    UPDATE_NOTIFICATION: {
      code: 500,
      message: 'Failed to update notification',
    },
    DELETE_NOTIFICATION: {
      code: 500,
      message: 'Failed to delete notification',
    },
    NOTIFICATION_NOT_FOUND: {
      code: 404,
      message: 'Notification not found',
    },
    NOTIFICATION_ACCESS_DENIED: {
      code: 403,
      message: 'Access denied: notification does not belong to the authenticated user',
    },

    /**
     * BOOKINGS
     */
    CREATE_BOOKING: {
      code: 500,
      message: 'Failed to create booking',
    },
    GET_BOOKINGS: {
      code: 500,
      message: 'Failed to get bookings',
    },
    GET_BOOKING: {
      code: 500,
      message: 'Failed to get booking',
    },
    UPDATE_BOOKING: {
      code: 500,
      message: 'Failed to update booking',
    },
    DELETE_BOOKING: {
      code: 500,
      message: 'Failed to delete booking',
    },
    BOOKING_NOT_FOUND: {
      code: 404,
      message: 'Booking not found',
    },
    BOOKING_ACCESS_DENIED: {
      code: 403,
      message: 'Access denied: booking does not belong to the authenticated user',
    },
    GET_MENTOR_BOOKINGS: {
      code: 500,
      message: 'Failed to get mentor bookings',
    },
    APPROVE_BOOKING: {
      code: 500,
      message: 'Failed to approve booking',
    },
    REJECT_BOOKING: {
      code: 500,
      message: 'Failed to reject booking',
    },
    COMPLETE_BOOKING: {
      code: 500,
      message: 'Failed to complete booking',
    },
    BOOKING_INVALID_TRANSITION: {
      code: 400,
      message: 'Invalid booking status transition',
    },

    /**
     * ACCOUNT DEACTIVATION
     */
    DEACTIVATION_TOKEN_INVALID: {
      code: 400,
      message: 'Invalid or expired deactivation token',
    },
    DEACTIVATION_INITIATE: {
      code: 500,
      message: 'Failed to initiate account deactivation',
    },
    DEACTIVATION_CONFIRM: {
      code: 500,
      message: 'Failed to confirm account deactivation',
    },
    ACCOUNT_DEACTIVATION_FAILED: {
      code: 500,
      message: 'Failed to deactivate account',
    },

    /**
     * MENTOR DOWNGRADE
     */
    MENTOR_DOWNGRADE_NOT_MENTOR: {
      code: 403,
      message: 'Access denied: only mentor accounts can be downgraded',
    },
    MENTOR_DOWNGRADE_FAILED: {
      code: 500,
      message: 'Failed to downgrade mentor account',
    },

    /**
     * AVAILABILITY MANAGEMENT
     */
    GET_AVAILABILITY_FAILED: {
      code: 500,
      message: 'Failed to get availability schedule',
    },
    UPDATE_AVAILABILITY_FAILED: {
      code: 500,
      message: 'Failed to update availability schedule',
    },
    ADD_AVAILABILITY_SLOT_FAILED: {
      code: 500,
      message: 'Failed to add availability slot',
    },
    DELETE_AVAILABILITY_SLOT_FAILED: {
      code: 500,
      message: 'Failed to delete availability slot',
    },
    AVAILABILITY_OVERLAP: {
      code: 400,
      message: 'Availability time frames must not overlap',
    },
    AVAILABILITY_INVALID_RANGE: {
      code: 400,
      message: 'Invalid time range: "from" must be earlier than "to"',
    },
    AVAILABILITY_SLOT_NOT_FOUND: {
      code: 404,
      message: 'Availability slot not found for the specified day',
    },
    AVAILABILITY_DUPLICATE_DAY: {
      code: 400,
      message: 'Availability schedule contains duplicate day entries',
    },
    AVAILABILITY_FRAME_TOO_SHORT: {
      code: 400,
      message: 'Each time frame must be at least as long as the session duration',
    },
    SET_SESSION_DURATION_FAILED: {
      code: 500,
      message: 'Failed to update session duration',
    },
    BOOKING_SCHEDULE_CONFLICT: {
      code: 409,
      message: 'The mentor already has a booking scheduled at this time',
    },
    BOOKING_OUTSIDE_AVAILABILITY: {
      code: 400,
      message: 'The selected time is outside the mentor\'s available hours',
    },
    BOOKING_MENTOR_NOT_AVAILABLE_DAY: {
      code: 400,
      message: 'The mentor is not available on the selected day',
    },
    BOOKING_SLOT_TOO_SHORT: {
      code: 400,
      message: 'The selected time frame does not fit a full session within the mentor\'s available window',
    },
  },

}

export const SWAGGER_DOCUMENTATION = {
  UPDATE_USER_PROFILE: {
    summary: 'Update User Profile (Mentor or Mentee)',
    description: `
This endpoint creates or updates the profile of a user.

Behavior:
- If user role is **Mentor**, it updates/creates a MentorProfile.
- If user role is **Mentee**, it updates/creates a MenteeProfile.
- Automatically sets \`isProfileComplete = true\` after successful update.
- Supports optional avatar upload via multipart/form-data.
- Logs the activity in system logs.

Frontend Notes:
- Must send multipart/form-data.
- "avatar" is optional.
- "files" is optional.
- DTO fields depend on user role.
`,

  },
  UPDATE_USER_STATUS: {
    summary: 'Update User Account Status',
    description: `
Updates the status of a user account.

Possible statuses:
- Active
- Inactive
- Suspended
- Pending

Used by admin panel.
`,
  },
  UPDATE_USER_ROLE: {
    summary: 'Update User Role',
    description: `
Updates the role of a user.

Possible roles:
- Mentee
- Mentor
- Admin

⚠️ Changing role does NOT automatically create profile records.
Frontend should call profile endpoint after role change if needed.
`,
  },
  PHONE_NUMBER: {
    example: '+639123456789',
    description: 'Mobile number in E.164 international format. Must start with "+" followed by country code and subscriber number (no spaces or dashes).'
  },
  MENTEE_BIO: {
    example: 'I am a software engineer with 5 years of experience. I am passionate about building software that makes people life easier.',
    description: 'Bio of the mentee. Must be at least 10 characters long.'
  },
  COUNTRY: {
    example: 'US',
    description: 'Country of the mentee. Must be a valid ISO 3166-1 alpha-2 country code.'
  },
  LANGUAGE: {
    example: 'en',
    description: 'Language of the mentee. Must be a valid ISO 639-1 language code.'
  },
  TIMEZONE: {
    example: 'Asia/Manila',
    description: 'IANA timezone identifier (e.g., "Asia/Manila", "America/New_York"). Used for scheduling and time-based features.'
  },
  UPDATED_BY_ID: {
    description: 'UUID of the user performing the update',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21'
  },
  DOWNGRADE_MENTOR: {
    summary: 'Downgrade mentor account to mentee',
    description: `
Downgrades an approved mentor account to a regular mentee account.

**Behavior:**
- Requires the user's current password for identity verification before any change is made.
- Updates role → \`mentee\`, status → \`active\`.
- Clears \`isMentorApproved\` and \`isMentorProfileComplete\` flags.
- **Permanently deletes the MentorProfile record** — bio, skills, session rate, availability are all removed.
- Sends an in-app notification and an email to the user confirming the downgrade.

**Access:** JWT required. Only the account owner or an admin can trigger this.

**Payload:**
\`\`\`json
{ "password": "CurrentPassword@123" }
\`\`\`
`,
    bodyExample: { password: 'CurrentPassword@123' },
  },
  SET_SESSION_DURATION: {
    summary: 'Set standard session duration (minutes)',
    description: `
Sets the mentor's standard session length. This value is used to:
- Validate that availability time frames are long enough to fit at least one session.
- Compute bookable time slots shown to mentees (e.g. 60 min → 09:00–10:00, 10:00–11:00, ...).
- Check booking conflict ranges when a mentee books a session.

**Rules:**
- Minimum value is **15 minutes**.
- Changing this does NOT retroactively affect existing bookings.

**Access:** JWT required. Approved mentor or admin only.

**Payload:**
\`\`\`json
{ "sessionDurationMinutes": 60 }
\`\`\`
`,
    bodyExample: { sessionDurationMinutes: 60 },
  },
  GET_AVAILABILITY: {
    summary: 'Get mentor availability schedule and session duration',
    description: `
Returns the mentor's full weekly availability schedule together with their standard session duration.

**Response \`data\` shape:**
\`\`\`json
{
  "sessionDurationMinutes": 60,
  "availability": [
    {
      "day": "monday",
      "timeFrames": [
        { "from": "09:00", "to": "12:00" },
        { "from": "14:00", "to": "17:00" }
      ]
    }
  ]
}
\`\`\`

**Frontend usage:**
Use \`sessionDurationMinutes\` to compute individual bookable slots from each time frame.
Example: \`09:00–12:00\` with 60-min sessions → slots \`09:00\`, \`10:00\`, \`11:00\`.
Filter out slots that are already booked before displaying to the mentee.

**Access:** JWT required. Any authenticated user can view a mentor's availability.
`,
  },
  UPDATE_AVAILABILITY: {
    summary: 'Replace the full availability schedule',
    description: `
Completely replaces the mentor's weekly availability schedule and updates the session duration in one call.

**Rules:**
- \`sessionDurationMinutes\` must be at least **15 minutes** and is required.
- Each time frame's duration must be **≥ sessionDurationMinutes** (e.g., a 30-min frame is rejected if duration is 60).
- \`from\` must be earlier than \`to\` for every time frame (e.g., \`"from": "10:00", "to": "09:00"\` is rejected).
- Time frames within the same day must not overlap.
- The same day must not appear more than once in the \`availability\` array.
- Days not listed are treated as unavailable.

**Day values (lowercase):** \`monday\` \`tuesday\` \`wednesday\` \`thursday\` \`friday\` \`saturday\` \`sunday\`

**Access:** JWT required. Approved mentor or admin only.

**Payload:**
\`\`\`json
{
  "sessionDurationMinutes": 60,
  "availability": [
    {
      "day": "monday",
      "timeFrames": [
        { "from": "09:00", "to": "12:00" },
        { "from": "14:00", "to": "17:00" }
      ]
    },
    {
      "day": "wednesday",
      "timeFrames": [
        { "from": "10:00", "to": "13:00" }
      ]
    }
  ]
}
\`\`\`
`,
    bodyExample: {
      sessionDurationMinutes: 60,
      availability: [
        { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }] },
        { day: 'wednesday', timeFrames: [{ from: '10:00', to: '13:00' }] },
      ],
    },
  },
  ADD_AVAILABILITY_SLOT: {
    summary: 'Append time frames to a single day',
    description: `
Adds new time frames to a specific day in the mentor's schedule. Unlike the full-replace endpoint, this **appends** to existing frames instead of overwriting them.

**Rules:**
- New frames must not overlap with **existing** frames already saved for that day.
- New frames must not overlap with each other.
- Each new frame must be **≥ sessionDurationMinutes** long (uses the saved duration unless \`sessionDurationMinutes\` is provided).
- Optionally updates \`sessionDurationMinutes\` at the same time.

**Day values (lowercase):** \`monday\` \`tuesday\` \`wednesday\` \`thursday\` \`friday\` \`saturday\` \`sunday\`

**Access:** JWT required. Approved mentor or admin only.

**Payload:**
\`\`\`json
{
  "day": "monday",
  "timeFrames": [
    { "from": "14:00", "to": "17:00" }
  ],
  "sessionDurationMinutes": 60
}
\`\`\`
`,
    bodyExample: {
      day: 'monday',
      timeFrames: [{ from: '14:00', to: '17:00' }],
      sessionDurationMinutes: 60,
    },
  },
  DELETE_AVAILABILITY_SLOT: {
    summary: 'Remove a time frame or entire day from availability',
    description: `
Removes a specific time frame or an entire day from the mentor's availability schedule.

**Behavior:**
- If \`timeFrameIndex\` is provided → removes only that time frame (0-based index from the day's \`timeFrames\` array). If it was the last frame for that day, the day entry is also removed.
- If \`timeFrameIndex\` is omitted → removes the entire day entry.
- Returns 404 if the specified day is not in the schedule.

**Day values (lowercase):** \`monday\` \`tuesday\` \`wednesday\` \`thursday\` \`friday\` \`saturday\` \`sunday\`

**Access:** JWT required. Approved mentor or admin only.

**Payload examples:**

Remove one time frame (index 0 = first frame):
\`\`\`json
{ "day": "monday", "timeFrameIndex": 0 }
\`\`\`

Remove the entire Monday entry:
\`\`\`json
{ "day": "monday" }
\`\`\`
`,
    bodyExample: { day: 'monday', timeFrameIndex: 0 },
  },
}

export const REDIRECT_LINKS  = {
  DEFAULT: 'localhost:4200',
  ADMIN_DASHBOARD: '/admin/dashboard',
  RESET_PASSWORD: '/reset-password',
  DEACTIVATE_ACCOUNT: '/deactivate',
}

export const RESEND_EMAIL_CONFIRMATION = {
  MAX_ATTEMPTS_PER_DAY: 3,
  MIN_INTERVAL_SECONDS: 60
}

export const SIGN_IN_WITH_PASSWORD = {
  MAX_ATTEMPTS_PER_DAY: 3
}

export const UPDATE_PASSWORD = {
  MAX_INCORRECT_ATTEMPTS_PER_DAY: 3
}

export const BUCKET_NAMES = {
  AVATARS: 'avatars',
  MENTOR_DOCUMENTS: 'mentor_documents',
  MENTEE_DOCUMENTS: 'mentee_documents',
}

export const DOCUMENTS_ALLOWED_TYPES = [
  'application/pdf',
]

export const IMAGES_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png'
]

export const REGEX = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+\d{10,15}$/,
}