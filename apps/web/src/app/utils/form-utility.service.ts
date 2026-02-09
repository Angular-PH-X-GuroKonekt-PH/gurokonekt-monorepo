/**
 * Utility functions for common form operations and data transformations
 */
export class FormUtilityService {
  
  /**
   * Clean phone number for submission (remove formatting)
   */
  static cleanPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[\s\-()]/g, '');
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phoneNumber: string, countryCode = 'PH'): string {
    const cleanNumber = FormUtilityService.cleanPhoneNumber(phoneNumber);
    
    // Add basic formatting based on country - can be expanded
    if (countryCode === 'PH' && cleanNumber.length === 11) {
      return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 7)} ${cleanNumber.slice(7)}`;
    }
    
    return cleanNumber;
  }

  /**
   * Validate and normalize email address
   */
  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Clean and validate LinkedIn URL
   */
  static normalizeLinkedInUrl(url: string): string {
    const cleanUrl = url.trim();
    
    // If URL doesn't start with http, add https
    if (cleanUrl && !cleanUrl.startsWith('http')) {
      return `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  }

  /**
   * Generate password strength score (0-4)
   */
  static getPasswordStrength(password: string): number {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    return score;
  }

  /**
   * Get password strength label
   */
  static getPasswordStrengthLabel(strength: number): string {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[strength] || 'Very Weak';
  }

  /**
   * Sanitize text input (remove potentially harmful characters)
   */
  static sanitizeTextInput(input: string): string {
    return input
      .trim()
      .replace(/[<>"'&]/g, '') // Remove basic XSS characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Extract form data with type safety
   */
  static extractFormData<T>(form: any, fieldMap?: Record<string, string>): T {
    const formValue = form.getRawValue ? form.getRawValue() : form.value;
    
    if (!fieldMap) {
      return formValue as T;
    }
    
    const mappedData: any = {};
    Object.entries(fieldMap).forEach(([formField, apiField]) => {
      if (formValue[formField] !== undefined) {
        mappedData[apiField] = formValue[formField];
      }
    });
    
    return mappedData as T;
  }

  /**
   * Check if two form values are equal (for detecting changes)
   */
  static areFormValuesEqual(value1: any, value2: any): boolean {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }

  /**
   * Get changed fields between two form values
   */
  static getChangedFields(oldValue: any, newValue: any): string[] {
    const changed: string[] = [];
    
    Object.keys({ ...oldValue, ...newValue }).forEach(key => {
      if (oldValue[key] !== newValue[key]) {
        changed.push(key);
      }
    });
    
    return changed;
  }

  /**
   * Auto-focus first invalid field in form
   */
  static focusFirstInvalidField(formElement: HTMLElement): void {
    const firstInvalidField = formElement.querySelector('.ng-invalid:not(form)') as HTMLElement;
    if (firstInvalidField) {
      firstInvalidField.focus();
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Debounce function for form input validation
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T, 
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}