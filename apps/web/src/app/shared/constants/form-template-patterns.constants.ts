/**
 * Template patterns and CSS classes for consistent form styling across components
 */

// Common CSS Classes
export const FORM_CSS_CLASSES = {
  // Form field wrapper
  FIELD_WRAPPER: 'space-y-6',
  FIELD_ITEM: '',
  
  // Labels
  LABEL_BASE: 'block text-sm font-semibold text-gray-700 mb-2',
  LABEL_REQUIRED: 'text-orange-500',
  
  // Input fields
  INPUT_BASE: 'w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors',
  INPUT_ERROR: 'border-red-500',
  INPUT_WITH_ICON: 'pr-12', // For password visibility toggle
  
  // Select dropdowns
  SELECT_BASE: 'w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors',
  SELECT_ERROR: 'border-red-500',
  
  // Error messages
  ERROR_TEXT: 'mt-1 text-sm text-red-600',
  
  // Help text
  HELP_TEXT: 'mt-1 text-xs text-gray-600',
  
  // Buttons
  BUTTON_PRIMARY: 'flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold hover:shadow-lg transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed',
  BUTTON_SECONDARY: 'flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  BUTTON_SUCCESS: 'flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-400 text-white font-bold hover:shadow-lg transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed',
  
  // Form layout
  FORM_CARD: 'bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-10 sm:p-12 lg:p-16',
  FORM_SECTION: 'space-y-6',
  FORM_SECTION_HEADER: 'text-center mb-8',
  FORM_SECTION_TITLE: 'text-2xl font-bold text-gray-900',
  FORM_SECTION_DESCRIPTION: 'text-gray-600 mt-2',
  
  // Step navigation
  STEP_NAVIGATION: 'flex items-center justify-between mt-8 pt-6 border-t border-gray-200',
  STEP_PROGRESS: 'text-sm text-gray-500',
  
  // Phone input specific
  PHONE_COUNTRY_BUTTON: 'flex items-center gap-2 h-full px-4 border-r-2 border-gray-200 bg-gray-50 rounded-l-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-28',
  PHONE_DROPDOWN: 'absolute top-full left-0 z-50 w-80 max-h-60 overflow-y-auto bg-white border-2 border-gray-200 rounded-xl shadow-lg mt-1',
  PHONE_INPUT: 'w-full pl-32 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors',
  
  // Password visibility toggle
  PASSWORD_TOGGLE_BUTTON: 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700',
  
  // Messages
  SUCCESS_MESSAGE: 'mb-6 p-4 rounded-xl bg-green-50 border border-green-200',
  ERROR_MESSAGE: 'mb-6 p-4 rounded-xl bg-red-50 border border-red-200',
  
  // Summary/Review section
  SUMMARY_CARD: 'bg-gray-50 rounded-xl p-6 space-y-4',
  SUMMARY_TITLE: 'text-lg font-semibold text-gray-900 mb-4',
  SUMMARY_GRID: 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm',
  
  // Checkbox
  CHECKBOX: 'mt-1 w-5 h-5 rounded border-2 border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500',
  
  // Step indicator
  STEP_CIRCLE_ACTIVE: 'border-orange-500 bg-orange-500 text-white shadow-lg',
  STEP_CIRCLE_COMPLETED: 'border-green-500 text-green-600',
  STEP_CIRCLE_INACTIVE: 'border-gray-300 text-gray-400',
  STEP_LINE_COMPLETED: 'bg-green-500',
  STEP_LINE_INACTIVE: 'bg-gray-200',
} as const;

// Common form field templates
export const FORM_FIELD_TEMPLATES = {
  // Standard text input template structure
  TEXT_INPUT: {
    wrapper: FORM_CSS_CLASSES.FIELD_ITEM,
    label: FORM_CSS_CLASSES.LABEL_BASE,
    input: FORM_CSS_CLASSES.INPUT_BASE,
    error: FORM_CSS_CLASSES.ERROR_TEXT,
    help: FORM_CSS_CLASSES.HELP_TEXT,
  },
  
  // Email input template
  EMAIL_INPUT: {
    wrapper: FORM_CSS_CLASSES.FIELD_ITEM,
    label: FORM_CSS_CLASSES.LABEL_BASE,
    input: FORM_CSS_CLASSES.INPUT_BASE,
    error: FORM_CSS_CLASSES.ERROR_TEXT,
    help: FORM_CSS_CLASSES.HELP_TEXT,
    placeholder: 'your.email@example.com',
  },
  
  // Password input template
  PASSWORD_INPUT: {
    wrapper: FORM_CSS_CLASSES.FIELD_ITEM,
    label: FORM_CSS_CLASSES.LABEL_BASE,
    inputWrapper: 'relative',
    input: `${FORM_CSS_CLASSES.INPUT_BASE} ${FORM_CSS_CLASSES.INPUT_WITH_ICON}`,
    toggleButton: FORM_CSS_CLASSES.PASSWORD_TOGGLE_BUTTON,
    error: FORM_CSS_CLASSES.ERROR_TEXT,
    help: FORM_CSS_CLASSES.HELP_TEXT,
    placeholder: '••••••••',
  },
  
  // Select dropdown template
  SELECT_INPUT: {
    wrapper: FORM_CSS_CLASSES.FIELD_ITEM,
    label: FORM_CSS_CLASSES.LABEL_BASE,
    select: FORM_CSS_CLASSES.SELECT_BASE,
    error: FORM_CSS_CLASSES.ERROR_TEXT,
    help: FORM_CSS_CLASSES.HELP_TEXT,
  },
  
  // Phone number with country selector template
  PHONE_INPUT: {
    wrapper: FORM_CSS_CLASSES.FIELD_ITEM,
    label: FORM_CSS_CLASSES.LABEL_BASE,
    inputWrapper: 'relative',
    countryButton: FORM_CSS_CLASSES.PHONE_COUNTRY_BUTTON,
    dropdown: FORM_CSS_CLASSES.PHONE_DROPDOWN,
    input: FORM_CSS_CLASSES.PHONE_INPUT,
    error: FORM_CSS_CLASSES.ERROR_TEXT,
    help: FORM_CSS_CLASSES.HELP_TEXT,
  },
} as const;

// Common patterns for error display
export const ERROR_DISPLAY_PATTERNS = {
  // Standard error condition
  SHOW_ERROR_CONDITION: 'hasError(fieldName)',
  
  // Password mismatch error condition
  SHOW_PASSWORD_MISMATCH: `registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched`,
  
  // Error message template
  ERROR_MESSAGE_TEMPLATE: '{{ getErrorMessage(fieldName) }}',
  
  // Help text conditions
  SHOW_HELP_WHEN_NO_ERROR: '!hasError(fieldName)',
} as const;

// Common validation patterns for different field types
export const FIELD_VALIDATION_CONFIGS = {
  FIRST_NAME: {
    validators: ['required', 'minLength(2)'],
    errorMessages: {
      required: 'First name is required',
      minlength: 'First name must be at least 2 characters',
    },
  },
  
  LAST_NAME: {
    validators: ['required', 'minLength(2)'],
    errorMessages: {
      required: 'Last name is required',
      minlength: 'Last name must be at least 2 characters',
    },
  },
  
  EMAIL: {
    validators: ['required', 'email'],
    errorMessages: {
      required: 'Email address is required',
      email: 'Please enter a valid email address',
    },
  },
  
  PASSWORD: {
    validators: ['required', 'minLength(8)', 'pattern(VALIDATION_PATTERNS.PASSWORD)'],
    errorMessages: {
      required: 'Password is required',
      minlength: 'Password must be at least 8 characters',
      pattern: 'Password must contain uppercase, number & special character',
    },
  },
  
  PHONE: {
    validators: ['required', 'pattern(VALIDATION_PATTERNS.PHONE)'],
    errorMessages: {
      required: 'Phone number is required',
      pattern: 'Please enter a valid phone number',
    },
  },
  
  COUNTRY: {
    validators: ['required'],
    errorMessages: {
      required: 'Please select your country',
    },
  },
  
  TIMEZONE: {
    validators: ['required'],
    errorMessages: {
      required: 'Please select your timezone',
    },
  },
} as const;

// Button patterns
export const BUTTON_PATTERNS = {
  PREVIOUS: {
    class: FORM_CSS_CLASSES.BUTTON_SECONDARY,
    text: 'Previous',
    icon: 'chevron-left',
    iconPosition: 'left',
    disabled: 'currentStep() === 1',
  },
  
  NEXT: {
    class: FORM_CSS_CLASSES.BUTTON_PRIMARY,
    text: 'Next',
    icon: 'chevron-right',
    iconPosition: 'right',
    disabled: '!isCurrentStepValid()',
  },
  
  SUBMIT: {
    class: FORM_CSS_CLASSES.BUTTON_SUCCESS,
    text: 'Create Account',
    icon: 'check-mark',
    iconPosition: 'left',
    disabled: 'submissionState.isLoading() || registerForm.invalid',
    loadingText: 'Creating Account...',
  },
  
  LOGIN_REDIRECT: {
    class: 'text-orange-600 hover:text-orange-700 font-semibold ml-1',
    text: 'Log in',
    action: 'navigateToLogin()',
  },
  
  REGISTER_REDIRECT: {
    class: 'text-orange-600 hover:text-orange-700 font-semibold ml-1',
    text: 'Create one',
    action: 'navigateToRegister()',
  },
} as const;

// Step navigation patterns
export const STEPPER_PATTERNS = {
  CIRCLE_SIZE: 'w-12 h-12',
  CIRCLE_BASE: 'relative flex items-center justify-center rounded-full border-2 transition-all duration-300 z-10 bg-white',
  CONNECTING_LINE: 'absolute top-6 left-1/2 w-full h-0.5 -z-10',
  STEP_INFO_WRAPPER: 'mt-4 text-center max-w-32',
  STEP_TITLE: 'text-sm font-semibold leading-tight mb-1',
  STEP_DESCRIPTION: 'text-xs text-gray-500 leading-relaxed',
} as const;

// Message patterns
export const MESSAGE_PATTERNS = {
  SUCCESS: {
    wrapper: FORM_CSS_CLASSES.SUCCESS_MESSAGE,
    iconClass: 'w-5 h-5',
    textClass: 'text-sm text-green-700 font-medium',
    icon: 'check',
  },
  
  ERROR: {
    wrapper: FORM_CSS_CLASSES.ERROR_MESSAGE,
    iconClass: 'w-5 h-5',
    textClass: 'text-sm text-red-700 font-medium',
    icon: 'alert-triangle',
  },
} as const;