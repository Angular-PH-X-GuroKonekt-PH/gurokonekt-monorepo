import { FormGroup } from '@angular/forms';
import { WritableSignal } from '@angular/core';

/**
 * Helper for handling common form submission patterns
 */
export class FormSubmissionHelper {
  /**
   * Handle pre-submission validation and setup
   */
  static prepareSubmission(
    form: FormGroup,
    isSubmitting: WritableSignal<boolean>,
    errorMessage: WritableSignal<string>
  ): boolean {
    if (form.invalid || isSubmitting()) {
      form.markAllAsTouched();
      return false;
    }

    isSubmitting.set(true);
    errorMessage.set('');
    return true;
  }

  /**
   * Handle submission error cleanup
   */
  static handleSubmissionError(
    errorOrState: any | {
      isLoading: WritableSignal<boolean>;
      error: WritableSignal<string | null>;
      isSuccess: WritableSignal<boolean>;
    },
    isSubmittingOrMessage: WritableSignal<boolean> | string,
    errorMessage?: WritableSignal<string>,
    customMessage?: string
  ): void {
    // Handle BaseRegistrationComponent signature
    if (typeof isSubmittingOrMessage === 'string' && 
        errorOrState && 
        'isLoading' in errorOrState && 
        'error' in errorOrState) {
      errorOrState.isLoading.set(false);
      errorOrState.isSuccess.set(false);
      errorOrState.error.set(isSubmittingOrMessage);
      return;
    }
    
    // Handle original signature
    console.error('Form submission failed:', errorOrState);
    
    const message = customMessage || 
                   errorOrState?.message || 
                   'An unexpected error occurred. Please try again.';
    
    if (errorMessage) {
      errorMessage.set(message);
    }
    if (isSubmittingOrMessage && typeof isSubmittingOrMessage !== 'string') {
      isSubmittingOrMessage.set(false);
    }
  }

  /**
   * Handle successful submission cleanup
   */
  static handleSubmissionSuccess(
    isSubmittingOrState: WritableSignal<boolean> | {
      isLoading: WritableSignal<boolean>;
      error: WritableSignal<string | null>;
      isSuccess: WritableSignal<boolean>;
    },
    successMessage?: WritableSignal<string>,
    message = 'Operation completed successfully!'
  ): void {
    // Handle BaseRegistrationComponent signature
    if (isSubmittingOrState && 
        typeof isSubmittingOrState === 'object' && 
        'isLoading' in isSubmittingOrState) {
      isSubmittingOrState.isLoading.set(false);
      isSubmittingOrState.error.set(null);
      isSubmittingOrState.isSuccess.set(true);
      return;
    }
    
    // Handle original signature
    if (typeof isSubmittingOrState !== 'object' || !('isLoading' in isSubmittingOrState)) {
      (isSubmittingOrState as WritableSignal<boolean>).set(false);
    }
    
    if (successMessage) {
      successMessage.set(message);
    }
  }

  /**
   * Pre-submission validation and loading check (alternative signature for BaseRegistrationComponent)
   */
  static preSubmissionValidation(form: FormGroup, isLoading: WritableSignal<boolean>): boolean {
    // Check if form is valid
    if (form.invalid) {
      form.markAllAsTouched();
      return false;
    }
    
    // Check if already loading
    if (isLoading()) {
      return false;
    }
    
    return true;
  }

  /**
   * Start submission state
   */
  static startSubmission(submissionState: {
    isLoading: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
    isSuccess: WritableSignal<boolean>;
  }): void {
    submissionState.isLoading.set(true);
    submissionState.error.set(null);
    submissionState.isSuccess.set(false);
  }

  /**
   * Simulate API delay for development/testing
   */
  static async simulateApiDelay(milliseconds = 1500): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * Extract form data safely with type checking
   */
  static extractFormData<T>(form: FormGroup): T {
    return form.getRawValue() as T;
  }
}