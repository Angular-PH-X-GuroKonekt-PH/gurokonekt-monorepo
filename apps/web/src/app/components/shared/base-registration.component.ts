import { inject, signal, effect, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { BaseFormComponent } from './base-form.component';
import { PasswordVisibilityHelper } from '../../helpers/password-visibility.helper';
import { LocationDataHelper } from '../../helpers/location-data.helper';
import { SignalStateHelper } from '../../helpers/signal-state.helper';
import { RouterNavigationHelper } from '../../helpers/router-navigation.helper';
import { FormSubmissionHelper } from '../../helpers/form-submission.helper';
import { getSelectedPhoneCountry, getPhoneFormatPlaceholder, getPhoneErrorMessage } from '@gurokonekt/utils';
import { detectCountryFromPhone } from '../../helpers/phone.formatter';
import { getTimezoneForCountry } from '../../helpers/timezone.helper';


export abstract class BaseRegistrationComponent extends BaseFormComponent {
  protected readonly router = inject(Router);
  protected readonly fb = inject(FormBuilder);
  
  protected readonly passwordHelper = new PasswordVisibilityHelper();
  protected readonly confirmPasswordHelper = new PasswordVisibilityHelper();
  
  protected readonly showPassword = this.passwordHelper.showPassword;
  protected readonly showConfirmPassword = this.confirmPasswordHelper.showPassword;
  
  protected readonly submissionState = SignalStateHelper.createSubmissionState();
  
  protected readonly showPhoneCountryDropdown = signal(false);
  protected readonly selectedPhoneCountry = signal('PH');
  
  protected readonly countries = LocationDataHelper.getCountries();
  protected readonly timezones = signal(LocationDataHelper.getTimezones());
  protected readonly languages = LocationDataHelper.getLanguages();
  
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
    return LocationDataHelper.getCountryDisplayName(countryCode);
  }
  
  protected getTimezoneDisplayName(timezoneValue: string): string {
    return LocationDataHelper.getTimezoneDisplayName(timezoneValue);
  }
  
  protected getLanguageDisplayName(langValue: string): string {
    return LocationDataHelper.getLanguageDisplayName(langValue);
  }
  
  protected navigateToLogin(): void {
    RouterNavigationHelper.navigateToLogin(this.router);
  }
  
  protected preSubmissionValidation(): boolean {
    return FormSubmissionHelper.preSubmissionValidation(
      this.registerForm, 
      this.submissionState.isLoading
    );
  }
  
  protected startSubmission(): void {
    FormSubmissionHelper.startSubmission(this.submissionState);
  }
  
  protected handleSubmissionSuccess(): void {
    FormSubmissionHelper.handleSubmissionSuccess(this.submissionState);
  }
  
  protected handleSubmissionError(message: string): void {
    FormSubmissionHelper.handleSubmissionError(this.submissionState, message);
  }
  
  protected scrollToTop(): void {
    window.scrollTo(0, 0);
  }
}