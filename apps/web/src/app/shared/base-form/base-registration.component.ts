import { inject, signal, effect, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import {
  createPasswordVisibilityState,
  getCountries,
  getLanguages,
  getTimezones,
  getCountryDisplayName,
  getTimezoneDisplayName,
  getLanguageDisplayName,
} from '../utils';
import {
  handleSubmissionError,
  handleSubmissionSuccess,
  preSubmissionValidation,
  startSubmission,
} from '../helpers/form-submission.helper';
import { detectCountryFromPhone } from '../utils/phone.util';
import { createSubmissionState } from '../utils/signal-state.util';
import { getTimezoneForCountry } from '../utils/timezone.util';
import { BaseFormComponent } from './base-form.component';
import { getSelectedPhoneCountry, getPhoneFormatPlaceholder, getPhoneErrorMessage } from '@gurokonekt/utils';
import { Router } from '@angular/router';
import { APP_ROUTES } from '../constants/routes';


export abstract class BaseRegistrationComponent extends BaseFormComponent {
  protected readonly fb = inject(FormBuilder);
  protected readonly router = inject(Router);
  
  protected readonly passwordHelper = createPasswordVisibilityState();
  protected readonly confirmPasswordHelper = createPasswordVisibilityState();
  
  protected readonly showPassword = this.passwordHelper.showPassword;
  protected readonly showConfirmPassword = this.confirmPasswordHelper.showPassword;
  
  protected readonly submissionState = createSubmissionState();
  
  protected readonly showPhoneCountryDropdown = signal(false);
  protected readonly selectedPhoneCountry = signal('PH');
  
  protected readonly countries = getCountries();
  protected readonly timezones = signal(getTimezones());
  protected readonly languages = getLanguages();
  
  protected abstract readonly registerForm: FormGroup;
  
  protected get form(): FormGroup {
    return this.registerForm;
  }
  
  protected togglePasswordVisibility(): void {
    this.passwordHelper.toggleVisibility();
  }
  
  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordHelper.toggleVisibility();
  }
  
  protected setupFormAutoPopulation(): void {
    const phoneValue = toSignal(this.registerForm.get('phoneNumber')?.valueChanges ?? of(''), { initialValue: '' });
    const countryValue = toSignal(this.registerForm.get('country')?.valueChanges ?? of(''), { initialValue: this.registerForm.get('country')?.value || '' });

    const initialCountry = this.registerForm.get('country')?.value;
    if (initialCountry && !this.registerForm.get('timezone')?.value) {
      const initialTimezone = getTimezoneForCountry(initialCountry);
      if (initialTimezone) {
        this.registerForm.patchValue({ timezone: initialTimezone }, { emitEvent: false });
      }
    }

    effect(() => {
      const phoneNumber = phoneValue();
      if (phoneNumber && phoneNumber.trim()) {
        const detectedCountry = detectCountryFromPhone(phoneNumber);
        
        if (detectedCountry) {
          const currentCountry = untracked(() => this.registerForm.get('country')?.value);
          if (detectedCountry !== currentCountry) {
            this.registerForm.patchValue(
              { country: detectedCountry }, 
              { emitEvent: false }
            );
          }
        }
      }
    });

    effect(() => {
      const country = countryValue();
      if (country) {
        const defaultTimezone = getTimezoneForCountry(country);
        
        if (defaultTimezone) {
          const currentTimezone = untracked(() => this.registerForm.get('timezone')?.value);
          if (defaultTimezone !== currentTimezone) {
            this.registerForm.patchValue(
              { timezone: defaultTimezone }, 
              { emitEvent: false }
            );
          }
        }
      }
    });
  }
  
  protected togglePhoneCountryDropdown(): void {
    this.showPhoneCountryDropdown.set(!this.showPhoneCountryDropdown());
  }
  
  protected closePhoneCountryDropdown(): void {
    this.showPhoneCountryDropdown.set(false);
  }
  
  protected selectPhoneCountry(countryCode: string): void {
    this.selectedPhoneCountry.set(countryCode);
    this.closePhoneCountryDropdown();
  }
  
  protected getSelectedPhoneCountry() {
    return getSelectedPhoneCountry(this.selectedPhoneCountry());
  }
  
  protected getPhoneFormatPlaceholder(): string {
    return getPhoneFormatPlaceholder(this.selectedPhoneCountry());
  }

  protected getPhoneErrorMessage(): string {
    const phoneControl = this.registerForm.get('phoneNumber');
    return getPhoneErrorMessage(phoneControl?.errors);
  }
  
  protected getCountryDisplayName(countryCode: string): string {
    return getCountryDisplayName(countryCode);
  }
  
  protected getTimezoneDisplayName(timezoneValue: string): string {
    return getTimezoneDisplayName(timezoneValue);
  }
  
  protected getLanguageDisplayName(langValue: string): string {
    return getLanguageDisplayName(langValue);
  }

  protected formatFullName(): string {
    const form = this.registerForm;
    const firstName = form.get('firstName')?.value?.trim() ?? '';
    const middleName = form.get('middleName')?.value?.trim() ?? '';
    const lastName = form.get('lastName')?.value?.trim() ?? '';
    const suffix = form.get('suffix')?.value?.trim() ?? '';

    const nameParts = [firstName, middleName, lastName].filter(Boolean);
    const fullName = nameParts.join(' ');

    return suffix ? `${fullName}, ${suffix}` : fullName;
  }

  protected navigateToLogin(): void {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }
  
  protected preSubmissionValidation(): boolean {
    return preSubmissionValidation(
      this.registerForm, 
      this.submissionState.isLoading()
    );
  }
  
  protected startSubmission(): void {
    startSubmission(this.submissionState);
  }
  
  protected handleSubmissionSuccess(): void {
    handleSubmissionSuccess(this.submissionState);
  }
  
  protected handleSubmissionError(message: string): void {
    handleSubmissionError(this.submissionState, message);
  }
  
  protected scrollToTop(): void {
    window.scrollTo(0, 0);
  }
}