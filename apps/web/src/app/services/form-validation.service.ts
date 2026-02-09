import { Injectable } from '@angular/core';
import { FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Service for common form validation logic
 */
@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  /**
   * Validate a specific step in a multi-step form
   */
  validateStep(form: FormGroup, step: number, stepFieldMap: Record<number, string[]>): boolean {
    const fieldsToValidate = stepFieldMap[step] || [];
    
    for (const fieldName of fieldsToValidate) {
      const control = form.get(fieldName);
      if (control && control.invalid) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get all validation errors for a form
   */
  getAllFormErrors(form: FormGroup): Record<string, ValidationErrors> {
    const errors: Record<string, ValidationErrors> = {};
    
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    
    return errors;
  }

  /**
   * Get the first error message from a form
   */
  getFirstErrorMessage(form: FormGroup): string | null {
    const errors = this.getAllFormErrors(form);
    const firstErrorKey = Object.keys(errors)[0];
    
    if (!firstErrorKey) {
      return null;
    }
    
    const firstError = errors[firstErrorKey];
    const errorType = Object.keys(firstError)[0];
    
    return this.getErrorMessageForField(firstErrorKey, errorType, firstError[errorType]);
  }

  /**
   * Get user-friendly error message for specific field and error type
   */
  private getErrorMessageForField(fieldName: string, errorType: string, errorValue: any): string {
    const fieldDisplayName = this.getFieldDisplayName(fieldName);
    
    switch (errorType) {
      case 'required':
        return `${fieldDisplayName} is required.`;
      case 'email':
        return `Please enter a valid email address.`;
      case 'minlength':
        return `${fieldDisplayName} must be at least ${errorValue.requiredLength} characters long.`;
      case 'maxlength':
        return `${fieldDisplayName} cannot exceed ${errorValue.requiredLength} characters.`;
      case 'pattern':
        return `Please enter a valid ${fieldDisplayName.toLowerCase()}.`;
      case 'min':
        return `${fieldDisplayName} must be at least ${errorValue.min}.`;
      case 'max':
        return `${fieldDisplayName} cannot exceed ${errorValue.max}.`;
      default:
        return `${fieldDisplayName} is invalid.`;
    }
  }

  /**
   * Convert field name to display name
   */
  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: Record<string, string> = {
      'firstName': 'First name',
      'lastName': 'Last name',
      'email': 'Email',
      'phoneNumber': 'Phone number',
      'password': 'Password',
      'confirmPassword': 'Confirm password',
      'country': 'Country',
      'timezone': 'Timezone',
      'language': 'Language',
      'acceptTerms': 'Terms acceptance',
      'expertiseAreas': 'Expertise areas',
      'yearsOfExperience': 'Years of experience',
      'linkedInUrl': 'LinkedIn URL'
    };
    
    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Check if form is ready for submission
   */
  isFormReadyForSubmission(form: FormGroup): boolean {
    return form.valid && !form.pending;
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  markAllFieldsAsTouched(form: FormGroup): void {
    form.markAllAsTouched();
  }

  /**
   * Reset form to initial state
   */
  resetForm(form: FormGroup): void {
    form.reset();
    form.markAsUntouched();
    form.markAsPristine();
  }
}