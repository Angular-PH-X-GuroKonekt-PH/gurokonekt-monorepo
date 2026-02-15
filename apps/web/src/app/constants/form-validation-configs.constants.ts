import { Validators } from '@angular/forms';
import { VALIDATION_PATTERNS } from './validation-patterns.constants';
import { CustomValidators } from '../validators/custom-validators';

/**
 * Common form field validation configurations for consistent validation setup
 */
export const FORM_FIELD_VALIDATORS = {
  // Personal Information Fields
  FIRST_NAME: [Validators.required, Validators.minLength(2)],
  LAST_NAME: [Validators.required, Validators.minLength(2)],
  MIDDLE_NAME: [], // Optional field
  SUFFIX: [], // Optional field
  
  // Contact Information
  EMAIL: [Validators.required, Validators.email],
  PHONE_NUMBER: [Validators.required, Validators.pattern(VALIDATION_PATTERNS.PHONE)],
  
  // Authentication Fields
  PASSWORD: [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(VALIDATION_PATTERNS.PASSWORD),
  ],
  CONFIRM_PASSWORD: [Validators.required],
  
  // Location Fields
  COUNTRY: [Validators.required],
  TIMEZONE: [Validators.required],
  LANGUAGE: [], // Optional, usually has default value
  
  // Professional Fields (for mentors)
  EXPERTISE_AREAS: [Validators.required, Validators.minLength(1)], // Array validation
  YEARS_OF_EXPERIENCE: [Validators.required, Validators.min(1), Validators.max(60)],
  LINKEDIN_URL: [
    Validators.required,
    Validators.pattern(VALIDATION_PATTERNS.LINKEDIN_URL),
  ],
  
  // File Upload Fields
  VERIFICATION_FILES: [Validators.required], // Array validation for files
  
  // Agreement Fields
  ACCEPT_TERMS: [Validators.requiredTrue],
  
  // User Identity Fields
  USERNAME: [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(20),
    Validators.pattern(VALIDATION_PATTERNS.USERNAME),
  ],
  
  // Optional personal fields
  BIO: [Validators.maxLength(500)],
  TITLE: [Validators.maxLength(100)],
  COMPANY: [Validators.maxLength(100)],
  
  // Number range validations
  AGE: [Validators.min(16), Validators.max(120)], // Optional age field
  HOURLY_RATE: [Validators.min(1), Validators.max(1000)], // Optional rate field
  
  // URL fields
  WEBSITE_URL: [Validators.pattern(VALIDATION_PATTERNS.URL)],
  PORTFOLIO_URL: [Validators.pattern(VALIDATION_PATTERNS.URL)],
  
} as const;

/**
 * Form group validators - applied at form level
 */
export const FORM_GROUP_VALIDATORS = {
  PASSWORD_MATCH: CustomValidators.passwordMatchValidator,
  
  // Add other form-level validators as needed
  // CONDITIONAL_REQUIRED: CustomValidators.conditionalRequired,
  // DATE_RANGE: CustomValidators.dateRange,
} as const;

/**
 * Common form configurations for different types of forms
 */
export const FORM_CONFIGURATIONS = {
  // Standard login form structure
  LOGIN: {
    fields: {
      email: { validators: FORM_FIELD_VALIDATORS.EMAIL, initialValue: '' },
      password: { validators: [Validators.required, Validators.minLength(1)], initialValue: '' }, // Simplified for login
    },
    groupValidators: [],
  },
  
  // Standard mentee registration form structure
  MENTEE_REGISTER: {
    fields: {
      firstName: { validators: FORM_FIELD_VALIDATORS.FIRST_NAME, initialValue: '' },
      lastName: { validators: FORM_FIELD_VALIDATORS.LAST_NAME, initialValue: '' },
      middleName: { validators: FORM_FIELD_VALIDATORS.MIDDLE_NAME, initialValue: '' },
      suffix: { validators: FORM_FIELD_VALIDATORS.SUFFIX, initialValue: '' },
      email: { validators: FORM_FIELD_VALIDATORS.EMAIL, initialValue: '' },
      phoneNumber: { validators: FORM_FIELD_VALIDATORS.PHONE_NUMBER, initialValue: '' },
      password: { validators: FORM_FIELD_VALIDATORS.PASSWORD, initialValue: '' },
      confirmPassword: { validators: FORM_FIELD_VALIDATORS.CONFIRM_PASSWORD, initialValue: '' },
      country: { validators: FORM_FIELD_VALIDATORS.COUNTRY, initialValue: '' },
      timezone: { validators: FORM_FIELD_VALIDATORS.TIMEZONE, initialValue: '' },
      language: { validators: FORM_FIELD_VALIDATORS.LANGUAGE, initialValue: 'en' },
      acceptTerms: { validators: FORM_FIELD_VALIDATORS.ACCEPT_TERMS, initialValue: false },
    },
    groupValidators: [FORM_GROUP_VALIDATORS.PASSWORD_MATCH],
  },
  
  // Standard mentor registration form structure
  MENTOR_REGISTER: {
    fields: {
      firstName: { validators: FORM_FIELD_VALIDATORS.FIRST_NAME, initialValue: '' },
      lastName: { validators: FORM_FIELD_VALIDATORS.LAST_NAME, initialValue: '' },
      middleName: { validators: FORM_FIELD_VALIDATORS.MIDDLE_NAME, initialValue: '' },
      suffix: { validators: FORM_FIELD_VALIDATORS.SUFFIX, initialValue: '' },
      email: { validators: FORM_FIELD_VALIDATORS.EMAIL, initialValue: '' },
      phoneNumber: { validators: FORM_FIELD_VALIDATORS.PHONE_NUMBER, initialValue: '' },
      password: { validators: FORM_FIELD_VALIDATORS.PASSWORD, initialValue: '' },
      confirmPassword: { validators: FORM_FIELD_VALIDATORS.CONFIRM_PASSWORD, initialValue: '' },
      country: { validators: FORM_FIELD_VALIDATORS.COUNTRY, initialValue: '' },
      timezone: { validators: FORM_FIELD_VALIDATORS.TIMEZONE, initialValue: '' },
      language: { validators: FORM_FIELD_VALIDATORS.LANGUAGE, initialValue: 'en' },
      expertiseAreas: { validators: FORM_FIELD_VALIDATORS.EXPERTISE_AREAS, initialValue: [] },
      yearsOfExperience: { validators: FORM_FIELD_VALIDATORS.YEARS_OF_EXPERIENCE, initialValue: null },
      linkedInUrl: { validators: FORM_FIELD_VALIDATORS.LINKEDIN_URL, initialValue: '' },
      verificationFiles: { validators: FORM_FIELD_VALIDATORS.VERIFICATION_FILES, initialValue: [] },
      acceptTerms: { validators: FORM_FIELD_VALIDATORS.ACCEPT_TERMS, initialValue: false },
    },
    groupValidators: [FORM_GROUP_VALIDATORS.PASSWORD_MATCH],
  },
  
  // Profile update form (subset of registration fields)
  PROFILE_UPDATE: {
    fields: {
      firstName: { validators: FORM_FIELD_VALIDATORS.FIRST_NAME, initialValue: '' },
      lastName: { validators: FORM_FIELD_VALIDATORS.LAST_NAME, initialValue: '' },
      phoneNumber: { validators: FORM_FIELD_VALIDATORS.PHONE_NUMBER, initialValue: '' },
      country: { validators: FORM_FIELD_VALIDATORS.COUNTRY, initialValue: '' },
      timezone: { validators: FORM_FIELD_VALIDATORS.TIMEZONE, initialValue: '' },
      language: { validators: FORM_FIELD_VALIDATORS.LANGUAGE, initialValue: 'en' },
      bio: { validators: FORM_FIELD_VALIDATORS.BIO, initialValue: '' },
      linkedInUrl: { validators: [Validators.pattern(VALIDATION_PATTERNS.LINKEDIN_URL)], initialValue: '' }, // Optional for profile
    },
    groupValidators: [],
  },
} as const;

/**
 * Helper function to create form configuration from FORM_CONFIGURATIONS
 */
export function createFormConfig(configName: keyof typeof FORM_CONFIGURATIONS) {
  const config = FORM_CONFIGURATIONS[configName];
  const formFields: { [key: string]: any } = {};
  
  // Create form fields object with initial values and validators
  Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
    formFields[fieldName] = [fieldConfig.initialValue, fieldConfig.validators];
  });
  
  return {
    fields: formFields,
    options: config.groupValidators.length > 0 ? { validators: config.groupValidators } : {}
  };
}

/**
 * Common validation length constraints
 */
export const VALIDATION_CONSTRAINTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  BIO_MAX_LENGTH: 500,
  TITLE_MAX_LENGTH: 100,
  COMPANY_MAX_LENGTH: 100,
  MIN_AGE: 16,
  MAX_AGE: 120,
  MIN_EXPERIENCE: 1,
  MAX_EXPERIENCE: 60,
  MIN_HOURLY_RATE: 1,
  MAX_HOURLY_RATE: 1000,
  MIN_EXPERTISE_AREAS: 1,
  MAX_EXPERTISE_AREAS: 10,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILES_COUNT: 5,
} as const;