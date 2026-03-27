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
  }
}

export const SWAGGER_DOCUMENTATION = {
  // ─── Auth ────────────────────────────────────────────────────────────────

  REGISTER_MENTEE: {
    summary: 'Register a new mentee account',
    description: `
Creates a new mentee user account in Supabase and the local database.

**Flow:**
1. Validates that email and phone number are not already registered.
2. Creates the Supabase auth user (sends a confirmation email automatically).
3. Creates the local \`User\` record with role \`mentee\` and status \`pending_approval\`.
4. Logs the registration event.

**After registration:**
- The user must confirm their email before they can sign in.
- Use \`POST /auth/resend-confirmation-link\` if the email is not received.

**Password rules:** minimum 8 characters, must include uppercase, lowercase, number, and symbol (e.g. \`Password@123\`).
`,
    bodyExample: {
      firstName: 'Jane',
      lastName: 'Dela Cruz',
      email: 'jane.delacruz@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      phoneNumber: '+639171234567',
      country: 'Philippines',
      language: 'English',
      timezone: 'Asia/Manila',
    },
  },

  REGISTER_MENTOR: {
    summary: 'Register a new mentor account',
    description: `
Creates a new mentor user account. Accepts \`multipart/form-data\` because mentor registration includes file uploads.

**Flow:**
1. Validates email and phone uniqueness.
2. Creates the Supabase auth user (confirmation email sent automatically).
3. Creates the local \`User\` record with role \`mentor\` and status \`pending_review\`.
4. Uploads any provided supporting documents (PDF, PNG, JPEG) to Supabase Storage.
5. Logs the registration event.

**File fields:**
- \`files\` — supporting documents (PDF, PNG, JPEG; max 10 MB each; up to 5 files). Required for mentor verification.

**After registration:**
- Account enters \`pending_review\` state until an admin approves it.
- The mentor must also confirm their email.
`,
    bodyExample: {
      firstName: 'Carlos',
      lastName: 'Reyes',
      email: 'carlos.reyes@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      phoneNumber: '+639281234567',
      country: 'Philippines',
      language: 'English',
      timezone: 'Asia/Manila',
      yearsOfExperience: 7,
      areasOfExpertise: '["Web Development", "System Design"]',
      linkedInUrl: 'https://linkedin.com/in/carlosreyes',
    },
  },

  LOGIN: {
    summary: 'Sign in with email and password',
    description: `
Authenticates a user with email and password via Supabase.

**Returns:** a JWT access token on success. Store this token and send it as \`Authorization: Bearer <token>\` on all protected requests.

**Rate limiting:** after 3 failed attempts the account is temporarily locked. Returns \`429\` if the limit is exceeded.

**Possible failures:**
- \`401\` — wrong email or password.
- \`403\` — email address not yet confirmed.
- \`429\` — too many failed login attempts.
`,
    bodyExample: {
      email: 'jane.delacruz@example.com',
      password: 'Password@123',
    },
  },

  SIGNIN_OAUTH: {
    summary: 'Sign in with an OAuth provider (Google / GitHub)',
    description: `
Exchanges an OAuth provider access token for a Gurokonekt session.

**Flow:**
1. The frontend completes the OAuth flow and receives an access token from the provider.
2. Send that token here along with the provider name.
3. The API validates the token with Supabase and returns a JWT.

**Supported providers:** \`google\`, \`github\`
`,
    bodyExample: {
      provider: 'google',
    },
  },

  RESEND_CONFIRMATION: {
    summary: 'Resend email confirmation link',
    description: `
Resends the confirmation email for a pending user registration.

**Rate limiting:** maximum 3 resend attempts per day with a minimum 60-second interval between requests.

**Use case:** call this when the user did not receive the confirmation email after \`POST /auth/register-mentee\` or \`POST /auth/register-mentor\`.

**\`type\` field:** use \`signup\` for new account confirmation.
`,
    bodyExample: {
      email: 'jane.delacruz@example.com',
      type: 'signup',
    },
  },

  UPDATE_PASSWORD: {
    summary: 'Update password for an authenticated user',
    description: `
Changes the password for an already authenticated user who knows their current password.

**Use this endpoint when:** the user is logged in and wants to change their password from account settings.

**Use \`POST /auth/forgot-password\` instead when:** the user has forgotten their current password.

**Rate limiting:** maximum 3 incorrect current-password attempts per day. Returns \`429\` if exceeded.
`,
    bodyExample: {
      userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      currentPassword: 'OldPassword@123',
      newPassword: 'NewPassword@456',
      confirmPassword: 'NewPassword@456',
    },
  },

  FORGOT_PASSWORD: {
    summary: 'Request a password reset link via email',
    description: `
Sends a password reset email to the given address if an account exists for it.

**Flow after this call:**
1. User receives an email with a reset link.
2. Frontend navigates the user to the reset-password page (link contains context).
3. User submits new password → \`POST /auth/reset-password\` → receives a PIN by email.
4. User submits the PIN → \`POST /auth/verify-reset-pin\` → password is updated.

**Note:** the endpoint always returns \`200\` regardless of whether the email exists (prevents user enumeration).
`,
    bodyExample: {
      email: 'jane.delacruz@example.com',
    },
  },

  RESET_PASSWORD: {
    summary: 'Submit new password after clicking reset link (step 2 of 3)',
    description: `
Second step of the password reset flow. Validates the new password and sends a 6-digit PIN to the user's email for final confirmation.

**Step sequence:**
1. \`POST /auth/forgot-password\` — sends reset link.
2. **\`POST /auth/reset-password\`** ← you are here — submits new password, sends PIN.
3. \`POST /auth/verify-reset-pin\` — verifies PIN, applies the password change.
`,
    bodyExample: {
      email: 'jane.delacruz@example.com',
      newPassword: 'NewPassword@456',
      confirmPassword: 'NewPassword@456',
    },
  },

  VERIFY_RESET_PIN: {
    summary: 'Verify PIN and finalise password reset (step 3 of 3)',
    description: `
Final step of the password reset flow. Validates the 6-digit PIN sent by \`POST /auth/reset-password\` and applies the password change in Supabase.

**The PIN expires after a short window.** If it is expired, restart from \`POST /auth/forgot-password\`.
`,
    bodyExample: {
      email: 'jane.delacruz@example.com',
      pin: '482910',
      newPassword: 'NewPassword@456',
      confirmPassword: 'NewPassword@456',
    },
  },

  // ─── User ─────────────────────────────────────────────────────────────────

  VERIFY_DEACTIVATION_TOKEN: {
    summary: 'Verify deactivation token from email link (public)',
    description: `
Validates the one-time deactivation token that was emailed to the user when they initiated account deactivation via \`POST /user/:userId/deactivate/initiate\`.

**This endpoint is public** — no JWT required. It is called by the frontend when the user clicks the confirmation link in the email.

**On success:** returns \`200\` confirming the token is valid. The frontend should then prompt the user for deactivation feedback and call \`POST /user/:userId/deactivate/feedback\` to finalise.

**On failure:** returns \`400\` if the token is invalid or expired.
`,
    bodyExample: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },

  GET_USER_PROFILE: {
    summary: 'Get user profile by ID',
    description: `
Returns the full profile of a user including their role-specific sub-profile (MenteeProfile or MentorProfile), avatar, and account metadata.

**This endpoint is public** — no JWT required. Use it to display any user's profile page.

**Response \`data\`** shape varies by role:
- **Mentee:** includes \`menteeProfile\` with bio, learning goals, areas of interest, availability.
- **Mentor:** includes \`mentorProfile\` with bio, expertise, skills, session rate, years of experience, availability, documents.
`,
  },

  GET_USER_DASHBOARD: {
    summary: 'Get dashboard data (role-based)',
    description: `
Returns dashboard data for the authenticated user. The shape of the response \`data\` field differs by role:

- **Mentor dashboard:** upcoming bookings, total sessions, pending requests, earnings summary.
- **Mentee dashboard:** upcoming sessions, booking history, recommended mentors.

**Access rules:**
- Mentors must have status \`approved\` and a complete profile; otherwise returns \`403\`.
- Mentees must have role \`mentee\`; otherwise returns \`403\`.
- The \`userId\` path param must match the authenticated user's JWT.
`,
  },

  GET_BOOKING_OVERVIEW: {
    summary: 'Get mentee booking summary',
    description: `
Returns a counts summary of the authenticated mentee's bookings broken down by status: total, upcoming (approved future sessions), completed, and pending.

**Access:** mentee role only. Returns \`403\` if the user is not a mentee.
`,
  },

  INITIATE_DEACTIVATION: {
    summary: 'Initiate account deactivation — verifies password and sends confirmation email',
    description: `
Step 1 of the account deactivation flow for mentee accounts.

**Flow:**
1. Verifies the supplied password against the current account.
2. Generates a one-time deactivation token and emails it to the user.
3. Frontend polls for the user to click the email link (which calls \`POST /user/deactivate/verify\`).
4. After token verification, user submits feedback via \`POST /user/:userId/deactivate/feedback\`.

**Access:** JWT required; mentee role only. Returns \`403\` for mentor/admin accounts.
`,
    bodyExample: {
      password: 'CurrentPassword@123',
    },
  },

  DEACTIVATION_FEEDBACK: {
    summary: 'Submit deactivation feedback and finalise account deactivation',
    description: `
Final step of the account deactivation flow. Validates the deactivation token (from the email link) one more time, records the user's reason for leaving, and marks the account as \`deleted\` in both Supabase and the local database.

**After this call:** the user's JWT will be rejected on all subsequent requests. The account cannot be recovered without admin intervention.
`,
    bodyExample: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      reason: 'I found a mentor outside the platform and no longer need the service.',
    },
  },

  UPDATE_USER_PROFILE: {
    summary: 'Update User Profile (Mentor or Mentee)',
    description: `
Creates or updates the profile of a user. Must be sent as \`multipart/form-data\`.

**Behavior:**
- If user role is **Mentor**, updates/creates a \`MentorProfile\`.
- If user role is **Mentee**, updates/creates a \`MenteeProfile\`.
- Automatically sets \`isProfileComplete = true\` after a successful update.
- Logs the activity in system logs.

**File fields (optional):**
- \`avatar\` — profile picture (PNG, JPEG, JPG; max 10 MB).
- \`files\` — supporting documents for mentors (PDF, PNG, JPEG; max 10 MB each; up to 5 files).

**Mentee fields:** bio, phoneNumber, country, language, timezone, learningGoals, areasOfInterest, preferredSessionType, availability, updatedById.

**Mentor fields:** bio, phoneNumber, country, language, timezone, areasOfExpertise, yearsOfExperience, skills, sessionRate, availability, updatedById.
`,
  },

  UPDATE_USER_STATUS: {
    summary: 'Update User Account Status',
    description: `
Updates the status of a user account. Intended for admin panel use.

**Possible statuses:** \`active\`, \`inactive\`, \`pending_approval\`, \`pending_review\`, \`approved\`, \`rejected\`, \`banned\`, \`suspended\`, \`deleted\`

**\`updatedById\`** must be the UUID of the admin performing the action (used for audit logging).
`,
    bodyExample: {
      status: 'approved',
      updatedById: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    },
  },

  UPDATE_USER_ROLE: {
    summary: 'Update User Role',
    description: `
Updates the role of a user. Intended for admin panel use.

**Possible roles:** \`mentee\`, \`mentor\`, \`admin\`

**\`updatedById\`** must be the UUID of the admin performing the action (used for audit logging).

⚠️ Changing role does **not** automatically create or migrate profile records. Call the profile update endpoint after a role change if a profile needs to be initialised.
`,
    bodyExample: {
      role: 'mentor',
      updatedById: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    },
  },

  // ─── Booking ──────────────────────────────────────────────────────────────

  CREATE_BOOKING: {
    summary: 'Create a new booking request (mentee only)',
    description: `
Creates a new session booking request from the authenticated mentee to a mentor.

**The mentee ID is read from the JWT** — do not send it in the body.

**Status flow:** \`PENDING\` → \`APPROVED\` (mentor approves) or \`REJECTED\` (mentor rejects) → \`COMPLETED\` (mentor marks done).

**\`sessionDateTime\`** must be a future ISO 8601 datetime string.
`,
    bodyExample: {
      mentorId: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
      sessionDateTime: '2026-04-15T10:00:00.000Z',
      notes: 'I would like to discuss transitioning into backend engineering.',
    },
  },

  APPROVE_BOOKING: {
    summary: 'Approve a pending booking (mentor only) — PENDING → APPROVED',
    description: `
Approves a booking that is currently in \`PENDING\` status. Only the mentor assigned to the booking can approve it.

**Requires \`sessionLink\`** — a video call or meeting URL that the mentee will use to join the session (e.g. Google Meet, Zoom).

**Status transition:** \`PENDING\` → \`APPROVED\` only. Attempting to approve a booking that is not \`PENDING\` returns \`400\`.
`,
    bodyExample: {
      sessionLink: 'https://meet.google.com/abc-defg-hij',
    },
  },

  UPDATE_BOOKING: {
    summary: 'Update booking details (partial)',
    description: `
Partially updates a booking. All fields are optional — send only the fields you want to change.

**Access:** only the booking owner (mentee) or the assigned mentor can update it.

**Note:** to approve or reject a booking, use the dedicated \`PATCH /:id/approve\` or \`PATCH /:id/reject\` endpoints — do not use this endpoint for status transitions.
`,
    bodyExample: {
      sessionDateTime: '2026-04-20T14:00:00.000Z',
      notes: 'Rescheduled — please confirm the new time.',
    },
  },

  // ─── Notification ─────────────────────────────────────────────────────────

  CREATE_NOTIFICATION: {
    summary: 'Create a new notification (internal / admin use)',
    description: `
Creates a notification record and delivers it in real-time via WebSocket to the target user if they are connected.

**Real-time delivery:** the \`NotificationGateway\` (Socket.IO) emits a \`notification:created\` event to the target user's socket if online.

**\`type\` options:** \`BOOKING\`, \`SESSION\`, \`MESSAGE\`, \`ANNOUNCEMENT\`

**\`referenceId\`** is optional — pass the related resource ID (e.g. booking UUID) so the frontend can deep-link to it.
`,
    bodyExample: {
      userId: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
      title: 'Booking Approved',
      message: 'Your session with Carlos Reyes on April 15 has been approved.',
      type: 'BOOKING',
      referenceId: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
    },
  },

  UPDATE_NOTIFICATION: {
    summary: 'Update a notification (status or message)',
    description: `
Updates a notification's status or message text.

**\`status\` options:** \`UNREAD\`, \`READ\`, \`DELETED\`

**Access:** only the notification's owner can update it. Returns \`403\` if the authenticated user does not own the notification.

**Tip:** to simply mark as read, use the dedicated \`PATCH /:id/read\` endpoint instead.
`,
    bodyExample: {
      status: 'READ',
    },
  },

  // ─── Search ───────────────────────────────────────────────────────────────

  GET_MENTOR_PROFILE: {
    summary: 'Get full mentor profile by mentor user ID',
    description: `
Returns the complete public profile of a single mentor including bio, areas of expertise, skills, session rate, years of experience, availability schedule, and avatar.

**Access:** JWT required. The mentor must have an \`approved\` status and a complete profile; otherwise returns \`404\`.
`,
  },

  SEARCH_MENTORS: {
    summary: 'Search and filter the mentor catalogue',
    description: `
Returns a paginated list of approved, active mentors matching the given filters.

**Role-based behaviour:**
- **Mentee:** applies intelligent profile-based matching using the mentee's learning goals and areas of interest in addition to any explicit filters.
- **Mentor / Admin:** applies only the explicit filters provided — no profile-based matching.

**All filters are optional and combinable.**

**Pagination:** default \`page=1\`, \`limit=10\`, maximum \`limit=50\`.

**Sorting options (\`sortBy\`):** \`newest\` | \`sessionRate\` | \`yearsExperience\` | \`name\`
`,
  },

  // ─── Field-level helpers ──────────────────────────────────────────────────

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
  }
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