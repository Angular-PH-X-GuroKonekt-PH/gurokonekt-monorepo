/**
 * Framework-agnostic form validation utilities
 */

/**
 * Password match validator function (framework-agnostic)
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Strong password validation
 */
export function validateStrongPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  if (!password) {
    return { isValid: true, errors: [] }; // Let required validator handle empty values
  }
  
  const errors: string[] = [];
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumeric = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  const minLength = password.length >= 8;
  
  if (!minLength) errors.push('Password must be at least 8 characters long');
  if (!hasUpperCase) errors.push('Password must contain an uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain a lowercase letter');
  if (!hasNumeric) errors.push('Password must contain a number');
  if (!hasSpecialChar) errors.push('Password must contain a special character (@$!%*?&)');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Phone number validation
 */
export function validatePhoneNumber(phoneNumber: string): {
  isValid: boolean;
  error?: string;
} {
  if (!phoneNumber) {
    return { isValid: true }; // Let required validator handle empty values
  }
  
  // Basic phone validation pattern - allows +, digits, spaces, dashes, and parentheses
  const phonePattern = /^\+?[\d\s\-()]+$/;
  
  if (!phonePattern.test(phoneNumber)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  // Check for minimum digits (at least 7)
  const digitCount = phoneNumber.replace(/\D/g, '').length;
  if (digitCount < 7) {
    return { isValid: false, error: 'Phone number is too short' };
  }
  
  return { isValid: true };
}

/**
 * Generic field validation error messages
 */
export const FIELD_ERROR_MESSAGES = {
  firstName: {
    required: 'Please enter your first name',
    minLength: 'First name must be at least 2 characters'
  },
  lastName: {
    required: 'Please enter your last name',
    minLength: 'Last name must be at least 2 characters'
  },
  email: {
    required: 'Email address is required',
    pattern: 'Please enter a valid email address (e.g., user@example.com)'
  },
  phoneNumber: {
    required: 'Phone number is required',
    pattern: 'Please enter a valid phone number with country code'
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters long',
    pattern: 'Password must contain uppercase letter, number, and special character (@$!%*?&)'
  },
  confirmPassword: {
    required: 'Please confirm your password'
  },
  country: {
    required: 'Please select your country'
  },
  timezone: {
    required: 'Please select your timezone'
  },
  acceptTerms: {
    required: 'You must accept the terms and conditions'
  }
};

/**
 * Get error message for a field and error type
 */
export function getFieldErrorMessage(fieldName: string, errorType: string): string {
  const fieldErrors = FIELD_ERROR_MESSAGES[fieldName as keyof typeof FIELD_ERROR_MESSAGES];
  if (fieldErrors && errorType in fieldErrors) {
    return fieldErrors[errorType as keyof typeof fieldErrors];
  }
  
  // Fallback messages
  switch (errorType) {
    case 'required':
      return 'This field is required';
    case 'email':
      return 'Please enter a valid email address';
    case 'minLength':
      return 'Input is too short';
    case 'pattern':
      return 'Invalid format';
    default:
      return 'Invalid input';
  }
}