import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { VALIDATION_PATTERNS } from '../constants/validation-patterns.constants';

/**
 * Custom validators for reactive forms
 */
export class CustomValidators {
  
  /**
   * Password match validator for reactive forms
   */
  static passwordMatchValidator(group: FormGroup): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Minimum number of items required validator for arrays
   */
  static minItemsRequired(minItems: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !Array.isArray(control.value)) {
        return { minItemsRequired: { requiredItems: minItems, actualItems: 0 } };
      }
      
      const actualItems = control.value.length;
      return actualItems >= minItems 
        ? null 
        : { minItemsRequired: { requiredItems: minItems, actualItems } };
    };
  }

  /**
   * Maximum number of items allowed validator for arrays
   */
  static maxItemsAllowed(maxItems: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !Array.isArray(control.value)) {
        return null;
      }
      
      const actualItems = control.value.length;
      return actualItems <= maxItems 
        ? null 
        : { maxItemsAllowed: { allowedItems: maxItems, actualItems } };
    };
  }

  /**
   * File size validator (in bytes)
   */
  static maxFileSize(maxSize: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !Array.isArray(control.value)) {
        return null;
      }
      
      const files = control.value as File[];
      const oversizedFile = files.find(file => file.size > maxSize);
      
      return oversizedFile 
        ? { 
            maxFileSize: { 
              maxSize, 
              actualSize: oversizedFile.size,
              fileName: oversizedFile.name 
            } 
          }
        : null;
    };
  }

  /**
   * Allowed file types validator
   */
  static allowedFileTypes(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !Array.isArray(control.value)) {
        return null;
      }
      
      const files = control.value as File[];
      const invalidFile = files.find(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const mimeType = file.type.toLowerCase();
        
        return !allowedTypes.some(type => 
          type.toLowerCase() === `.${fileExtension}` || 
          type.toLowerCase() === fileExtension ||
          mimeType.includes(type.toLowerCase())
        );
      });
      
      return invalidFile 
        ? { 
            allowedFileTypes: { 
              allowedTypes, 
              invalidFileName: invalidFile.name,
              invalidType: invalidFile.type
            } 
          }
        : null;
    };
  }

  /**
   * URL format validator with protocol requirement
   */
  static urlWithProtocol(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const urlPattern = /^https?:\/\/.+/i;
      return urlPattern.test(control.value) ? null : { urlWithProtocol: true };
    };
  }

  /**
   * Age range validator
   */
  static ageRange(minAge: number, maxAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const age = parseInt(control.value, 10);
      if (isNaN(age)) {
        return { invalidAge: true };
      }
      
      if (age < minAge || age > maxAge) {
        return { ageRange: { minAge, maxAge, actualAge: age } };
      }
      
      return null;
    };
  }

  /**
   * LinkedIn URL specific validator
   */
  static linkedInUrl(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      return VALIDATION_PATTERNS.LINKEDIN_URL.test(control.value) ? null : { linkedInUrl: true };
    };
  }

  /**
   * Strong password validator (already covered by pattern but more descriptive)
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const password = control.value;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const hasMinLength = password.length >= 8;
      
      const errors: { [key: string]: boolean | { requiredLength: number; actualLength: number } } = {};
      
      if (!hasUpperCase) errors['noUpperCase'] = true;
      if (!hasLowerCase) errors['noLowerCase'] = true;
      if (!hasNumber) errors['noNumber'] = true;
      if (!hasSpecialChar) errors['noSpecialChar'] = true;
      if (!hasMinLength) errors['minLength'] = { requiredLength: 8, actualLength: password.length };
      
      return Object.keys(errors).length > 0 ? { strongPassword: errors } : null;
    };
  }

  /**
   * Validates phone number length based on selected country
   * Get country code from form control: control.parent?.get('country')?.value
   * Usage: validators: [Validators.required, CustomValidators.phoneNumberByCountry()]
   */
  static phoneNumberByCountry(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      // Get country from parent form group
      const countryCode = control.parent?.get('country')?.value;
      if (!countryCode) {
        return null; // Skip validation if country not selected
      }

      try {
        const { isValidPhoneLengthForCountry } = require('../helpers/phone.formatter');
        
        const isValid = isValidPhoneLengthForCountry(control.value, countryCode);
        return isValid ? null : { 
          phoneNumberByCountry: { 
            country: countryCode,
            value: control.value 
          } 
        };
      } catch (error) {
        // If helper is not available, skip validation
        return null;
      }
    };
  }
}
