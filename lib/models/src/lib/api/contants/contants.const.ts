export const API_RESPONSE = {
  SUCCESS: {
    /**
     * SERVICES
     * */ 
    SUPABASE_SERVICE: {
      code:  200,
      message: '',
    },
    PRISMA_SERVICE: {
      code:  200,
      message: '',
    },

    /**
     * AUTH
     * */ 
    REGISTER_MENTEE: {
      code:  201,
      message: '',
    },
    REGISTER_MENTOR: {
      code:  200,
      message: '',
    },
    SIGN_WITH_OATH: {
      code:  200,
      message: '',
    },
    SIGN_WITH_PASSWORD: {
      code:  200,
      message: '',
    },
    SIGN_OUT: {
      code:  200,
      message: '',
    },
    CONFIRMATION_EMAIL_SENT: {
      code:  200,
      message: 'Confirmation email sent',
    },

    UPLOAD_FILES: {
      code: 200,
      message: '',
    }
  },
  ERROR: {
    /**
     * SERVICES
     * */ 
    SUPABASE_SERVICE: {
      code:  500,
      message: '',
    },
    SUPABASE_CREDENTIALS_NOT_FOUND: {
      code:  500,
      message: 'Supabase credentials not found',
    },
    PRISMA_SERVICE: {
      code:  500,
      message: '',
    },

    /**
     * AUTH
     * */ 
    REGISTER_MENTEE: {
      code:  500,
      message: '',
    },
    REGISTER_MENTOR: {
      code:  500,
      message: '',
    },
    USER_ALREADY_EXISTS: {
      code:  409,
      message: 'User already exists',
    },
    USER_NOT_FOUND: {
      code:  404,
      message: 'User not found',
    },
    EMAIL_ALREADY_CONFIRMED: {
      code:  400,
      message: 'Email address is already confirmed',
    },
    SIGNIN_ATTEMPT_INVALID_CREDENTIALS: {
      code:  401,
      message: 'Invalid credentials',
    },
    SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED: {
      code:  403,
      message: 'Failed signin attempt: Email address is not verified',
    },
    SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS: {
      code:  429,
      message: 'Too many failed login attempts. Try again later.',
    },
    PASSWORD_REGEX_MISMATCH: {
      code:  400,
      message: 'Minimum 8 characters, must include uppercase, lowercase, number, and symbol',
    },
    PASSWORD_MISMATCH: {
      code:  400,
      message: 'Must match the password field',
    },
    INVALID_PHONE_FORMAT: {
      code:  400,
      message: 'Invalid phone format',
    },
    INVALID_URL: {
      code:  400,
      message: 'Invalid URL',
    },

    /**
     * STORAGE
     * */ 
    UNSUPPORTED_FILE_TYPE: {
      code:  400,
      message: 'Missing required fields',
    },
    INVALID_BUCKET_NAME: {
      code:  400,
      message: 'Missing required fields',
    },

    MISSING_REQUIRED_FIELDS: {
      code:  400,
      message: 'Missing required fields',
    },
    INTERNAL_SERVER_ERROR: {
      code:  500,
      message: 'Internal Server Error',
    },
    TOO_MANY_REQUESTS: {
      code:  429,
      message: 'Too many requests',
    }
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