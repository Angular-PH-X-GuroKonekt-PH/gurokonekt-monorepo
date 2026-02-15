// Validation patterns and constants
export * from './validation-patterns.constants';
export * from './form-validation-configs.constants';
export * from './form-template-patterns.constants';

// Location and language data
export * from './countries.constants';
export * from './timezones.constants';
export * from './languages.constants';

// Expertise options
export * from './expertise.constants';

// Phone country codes
export * from './phone-country-codes.constants';

// Timezone mapping
export * from './timezone-mapping.constants';

// Re-export commonly used patterns for convenience
export { 
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES 
} from './validation-patterns.constants';

export { 
  FORM_FIELD_VALIDATORS,
  FORM_GROUP_VALIDATORS,
  FORM_CONFIGURATIONS,
  VALIDATION_CONSTRAINTS,
  createFormConfig 
} from './form-validation-configs.constants';

export { 
  FORM_CSS_CLASSES,
  FORM_FIELD_TEMPLATES,
  ERROR_DISPLAY_PATTERNS,
  BUTTON_PATTERNS,
  STEPPER_PATTERNS,
  MESSAGE_PATTERNS 
} from './form-template-patterns.constants';