import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  FormValidationHelper, 
  PasswordVisibilityHelper, 
  LoadingStateHelper,
  LocationDataHelper 
} from '../helpers';
import { VALIDATION_PATTERNS } from '../constants/validation-patterns.constants';
import { CustomValidators } from '../validators/custom-validators';

/**
 * Service that combines common form functionality for easy injection
 */
@Injectable({
  providedIn: 'root'
})
export class FormHelperService {
  private readonly fb = inject(FormBuilder);

  /**
   * Create a new password visibility helper
   */
  createPasswordHelper(): PasswordVisibilityHelper {
    return new PasswordVisibilityHelper();
  }

  /**
   * Create a new loading state helper
   */
  createLoadingHelper(): LoadingStateHelper {
    return new LoadingStateHelper();
  }

  /**
   * Create standard login form
   */
  createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  /**
   * Create standard mentee registration form
   */
  createMenteeRegisterForm(): FormGroup {
    return this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        middleName: [''], // Optional field for lib model compatibility
        suffix: [''], // Optional field for lib model compatibility
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(VALIDATION_PATTERNS.PHONE)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(VALIDATION_PATTERNS.PASSWORD),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        country: ['', [Validators.required]],
        timezone: ['', [Validators.required]],
        language: ['en'],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: CustomValidators.passwordMatchValidator }
    );
  }

  /**
   * Create standard mentor registration form
   */
  createMentorRegisterForm(): FormGroup {
    return this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        middleName: [''], // Optional field for lib model compatibility
        suffix: [''], // Optional field for lib model compatibility
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(VALIDATION_PATTERNS.PHONE)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(VALIDATION_PATTERNS.PASSWORD),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        country: ['', [Validators.required]],
        timezone: ['', [Validators.required]],
        language: ['en'],
        expertiseAreas: [[], [Validators.required, Validators.minLength(1)]],
        yearsOfExperience: ['', [Validators.required, Validators.min(1), Validators.max(60)]],
        linkedInUrl: ['', [
          Validators.required,
          Validators.pattern(VALIDATION_PATTERNS.LINKEDIN_URL)
        ]],
        verificationFiles: [[], [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: CustomValidators.passwordMatchValidator }
    );
  }

  /**
   * Get location data
   */
  getLocationData() {
    return {
      countries: LocationDataHelper.getCountries(),
      timezones: LocationDataHelper.getTimezones(),
      languages: LocationDataHelper.getLanguages(),
    };
  }

  /**
   * Handle country change with timezone auto-selection
   */
  handleCountryChange(form: FormGroup, countryCode: string): void {
    const defaultTimezone = LocationDataHelper.getDefaultTimezoneForCountry(countryCode);
    if (defaultTimezone) {
      form.patchValue({ timezone: defaultTimezone });
    }
  }

  // Expose static methods for convenience
  hasError = (form: FormGroup, fieldName: string) => FormValidationHelper.hasError(form, fieldName);
  getErrorMessage = (form: FormGroup, fieldName: string) => FormValidationHelper.getErrorMessage(form, fieldName);
  markAllFieldsTouched = FormValidationHelper.markAllFieldsTouched;
  resetValidationState = FormValidationHelper.resetValidationState;
}