import { FormGroup, ValidationErrors } from '@angular/forms';
import { VALIDATION_MESSAGES } from '../constants/validation-patterns.constants';

/**
 * Helper class for form validation and error handling
 */
export class FormValidationHelper {
  
  /**
   * Check if a form field has validation errors
   */
  static hasError(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Get formatted error message for a form field
   */
  static getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control?.touched || !control?.errors) {
      return '';
    }

    return FormValidationHelper.mapErrorToMessage(fieldName, control.errors);
  }

  /**
   * Map validation errors to user-friendly messages
   * @param fieldName The name of the form field
   * @param errors ValidationErrors object from Angular forms
   * @returns User-friendly error message string
   */
  static mapErrorToMessage(fieldName: string, errors: ValidationErrors): string {
    const fieldDisplayName = FormValidationHelper.getFieldDisplayName(fieldName);

    if (errors['required']) {
      return `${fieldDisplayName} is required`;
    }
    
    if (errors['email']) {
      return VALIDATION_MESSAGES.EMAIL;
    }
    
    if (errors['minlength']) {
      const minLength = errors['minlength']['requiredLength'] as number;
      return `${fieldDisplayName} must be at least ${minLength} characters`;
    }
    
    if (errors['maxlength']) {
      const maxLength = errors['maxlength']['requiredLength'] as number;
      return `${fieldDisplayName} cannot exceed ${maxLength} characters`;
    }
    
    if (errors['pattern']) {
      return FormValidationHelper.getPatternErrorMessage(fieldName);
    }
    
    if (errors['min']) {
      const min = errors['min']['min'] as number;
      return `${fieldDisplayName} must be at least ${min}`;
    }
    
    if (errors['max']) {
      const max = errors['max']['max'] as number;
      return `${fieldDisplayName} cannot exceed ${max}`;
    }

    if (errors['requiredTrue']) {
      return 'You must accept the terms and conditions';
    }

    // Custom validator errors
    if (errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    if (errors['minItemsRequired']) {
      const { requiredItems } = errors['minItemsRequired'];
      return `Please select at least ${requiredItems} ${requiredItems === 1 ? 'item' : 'items'}`;
    }

    if (errors['maxItemsAllowed']) {
      const { allowedItems } = errors['maxItemsAllowed'];
      return `Maximum ${allowedItems} ${allowedItems === 1 ? 'item' : 'items'} allowed`;
    }

    if (errors['maxFileSize']) {
      const { maxSize, fileName } = errors['maxFileSize'];
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File "${fileName}" exceeds maximum size of ${maxSizeMB}MB`;
    }

    if (errors['allowedFileTypes']) {
      const { allowedTypes, invalidFileName } = errors['allowedFileTypes'];
      return `File "${invalidFileName}" has invalid type. Allowed: ${allowedTypes.join(', ')}`;
    }

    if (errors['urlWithProtocol']) {
      return 'URL must start with http:// or https://';
    }

    if (errors['linkedInUrl']) {
      return VALIDATION_MESSAGES.LINKEDIN_URL;
    }

    if (errors['ageRange']) {
      const { minAge, maxAge } = errors['ageRange'];
      return `Age must be between ${minAge} and ${maxAge}`;
    }

    if (errors['strongPassword']) {
      const passwordErrors = errors['strongPassword'];
      const messages = [];
      if (passwordErrors.noUpperCase) messages.push('one uppercase letter');
      if (passwordErrors.noLowerCase) messages.push('one lowercase letter');
      if (passwordErrors.noNumber) messages.push('one number');
      if (passwordErrors.noSpecialChar) messages.push('one special character');
      return `Password must contain ${messages.join(', ')}`;
    }

    return `${fieldDisplayName} is invalid`;
  }

  /**
   * Get user-friendly field display names
   */
  private static getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email address',
      password: 'Password',
      confirmPassword: 'Confirm password',
      phoneNumber: 'Phone number',
      country: 'Country',
      timezone: 'Timezone',
      language: 'Language',
      yearsOfExperience: 'Years of experience',
      linkedInUrl: 'LinkedIn URL',
      expertiseAreas: 'Areas of expertise',
      verificationFiles: 'Verification files',
      acceptTerms: 'Terms and conditions'
    };

    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Get specific error messages for pattern validation
   */
  private static getPatternErrorMessage(fieldName: string): string {
    // Use centralized validation messages
    switch (fieldName) {
      case 'password':
        return VALIDATION_MESSAGES.PASSWORD;
      case 'phoneNumber':
        return VALIDATION_MESSAGES.PHONE;
      case 'linkedInUrl':
        return VALIDATION_MESSAGES.LINKEDIN_URL;
      case 'email':
        return VALIDATION_MESSAGES.EMAIL;
      default:
        return 'Please enter a valid format';
    }
  }

  /**
   * Mark all form fields as touched to trigger validation display
   */
  static markAllFieldsTouched(form: FormGroup): void {
    form.markAllAsTouched();
  }

  /**
   * Reset form validation state
   */
  static resetValidationState(form: FormGroup): void {
    form.markAsUntouched();
    form.markAsPristine();
  }
}