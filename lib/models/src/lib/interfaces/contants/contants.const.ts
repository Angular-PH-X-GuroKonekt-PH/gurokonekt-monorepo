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

    UPDATE_USER_STATUS: {
      code: 200,
      message: 'User status updated successfully',
    },
    UPDATE_USER_ROLE: {
      code: 200,
      message: 'User role updated successfully',
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
  }
}

export const REDIRECT_LINKS  = {
  DEFAULT: 'localhost:4200',
}

export const RESEND_EMAIL_CONFIRMATION = {
  MAX_ATTEMPTS_PER_DAY: 3,
  MIN_INTERVAL_SECONDS: 60
}

export const SIGN_IN_WITH_PASSWORD = {
  MAX_ATTEMPTS_PER_DAY: 3
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