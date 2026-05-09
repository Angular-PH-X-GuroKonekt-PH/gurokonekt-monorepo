/**
 * Validation patterns for common form validations
 */
export const VALIDATION_PATTERNS = {
  /**
   * Password pattern - requires at least 8 characters with:
   * - At least one lowercase letter
   * - At least one uppercase letter
   * - At least one number
   * - At least one special character (!@#$%^&*)
   * Matches API requirement
   */
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,

  /**
   * Email pattern - basic email validation
   */
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  /**
   * Phone number pattern - accepts international and local formats
   * Accepts: +639123456789 or 09123456789 or 9123456789
   * Will be formatted to E.164 before API submission
   */
  PHONE: /^[+]?\d{9,15}$/,
  NAME: /^[a-zA-Z\s\-']+$/,

  /**
   * LinkedIn URL pattern
   */
  LINKEDIN_URL: /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,

  /**
   * Strong password pattern (more restrictive)
   * Requires: 8-20 chars, uppercase, lowercase, number, special char
   */
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,

  /**
   * Username pattern - alphanumeric with underscores and hyphens
   */
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,

  /**
   * URL pattern - basic URL validation
   */
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
} as const;

/**
 * Validation error messages corresponding to patterns
 */
export const VALIDATION_MESSAGES = {
  PASSWORD:
    'Password must be at least 8 characters with uppercase, number & special character',
  EMAIL: 'Please enter a valid email address',
  PHONE: 'Please enter a valid phone number',
  NAME: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  LINKEDIN_URL: 'Please enter a valid LinkedIn profile URL',
  STRONG_PASSWORD:
    'Password must be 8-20 characters with uppercase, lowercase, number & special character',
  USERNAME:
    'Username must be 3-20 characters with letters, numbers, underscores, or hyphens',
  URL: 'Please enter a valid URL',
} as const;
