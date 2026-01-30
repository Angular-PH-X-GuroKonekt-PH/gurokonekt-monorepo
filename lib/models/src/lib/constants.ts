export const RETURN_MESSAGES = {
  SUCCESS: {
    REGISTER_MENTEE: 'Mentee registered successfully',
    REGISTER_MENTOR: 'Mentor registered successfully',
    SIGN_UP_SUCCESS: 'Sign up success',
    SIGN_IN_SUCCESS: 'Sign in success',
    EMAIL_SENT: 'Email sent',
    EMAIL_UPDATED: 'Email updated',
    PASSWORD_UPDATED: 'Password updated',
    USER_AUTH_RETRIEVED: 'User auth retrieved',
    SIGN_OUT_SUCCESS: 'Sign out success',
    PROFILE_UPDATED: 'Profile updated',
    ACCOUNT_DELETED: 'Account deleted',
    PROFILE_CREATED: 'Profile created',
    PROFILE_RETRIEVED: 'Profile retrieved',
    USER_CREATED: 'User created',
    USER_ROLE_UPDATED: 'User role updated',
    USER_STATUS_UPDATED: 'User status updated',
    GET_PROFILE: 'Profile retrieved',
    FILE_UPLOAD_SUCCESS: 'File upload success',
    FILE_DELETE_SUCCESS: 'File delete success',
  },
  FAILURE: {
    SUPABASE_CREDENTIALS_NOT_FOUND: 'Supabase credentials not found',
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
    REGISTER_MENTEE: 'Register mentee failed',
    REGISTER_MENTOR: 'Register mentor failed',
    SIGN_UP_FAILED: 'Sign up failed',
    USER_NOT_FOUND: 'User not found',
    ACCOUNT_ALREADY_DELETED: 'Account already deleted',
    UNAUTHORIZED: 'Unauthorized',
    PROFILE_NOT_FOUND: 'Profile not found',
    UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
    FILE_URL_NOT_FOUND: 'File URL not found',
    START_WITH_AVATAR: 'All storage paths must be avatar files (start with "avatars/")',
    START_WITH_DOCUMENTS: 'All storage paths must be document files (start with "documents/")',
    USER_ALREADY_EXISTS: 'User already exists',
    MISSING_REQUIRED_FIELDS: 'Missing required fields'
  },
  LINKS: {
    DEFAULT_REDIRECT_URL: 'https://google.com',
  }
}

export const RESPONSE_STATUS = {
  201: ''
}

export const BUCKET_NAME = 'attachments';

export const DOCUMENTS_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export const AVATAR_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
]
