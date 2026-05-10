import { FormGroup } from '@angular/forms';
import { Signal, WritableSignal } from '@angular/core';
import { SubmissionState } from '../interfaces/submission-state.interface';

/**
 * Helper for handling common form submission patterns
 */
export function prepareSubmission(
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

export function handleSubmissionError(
  errorOrState: any | SubmissionState,
  isSubmittingOrMessage: WritableSignal<boolean> | string,
  errorMessage?: WritableSignal<string>,
  customMessage?: string
): void {
  if (
    typeof isSubmittingOrMessage === 'string' &&
    errorOrState &&
    'isLoading' in errorOrState &&
    'error' in errorOrState
  ) {
    errorOrState.isLoading.set(false);
    errorOrState.isSuccess.set(false);
    errorOrState.error.set(isSubmittingOrMessage);
    return;
  }

  const message =
    customMessage ||
    errorOrState?.message ||
    'An unexpected error occurred. Please try again.';

  if (errorMessage) {
    errorMessage.set(message);
  }
  if (isSubmittingOrMessage && typeof isSubmittingOrMessage !== 'string') {
    isSubmittingOrMessage.set(false);
  }
}

export function handleSubmissionSuccess(
  isSubmittingOrState: WritableSignal<boolean> | SubmissionState,
  successMessage?: WritableSignal<string>,
  message = 'Operation completed successfully!'
): void {
  if (
    isSubmittingOrState &&
    typeof isSubmittingOrState === 'object' &&
    'isLoading' in isSubmittingOrState
  ) {
    isSubmittingOrState.isLoading.set(false);
    isSubmittingOrState.error.set(null);
    isSubmittingOrState.isSuccess.set(true);
    return;
  }

  if (
    typeof isSubmittingOrState !== 'object' ||
    !('isLoading' in isSubmittingOrState)
  ) {
    (isSubmittingOrState as WritableSignal<boolean>).set(false);
  }

  if (successMessage) {
    successMessage.set(message);
  }
}

export function preSubmissionValidation(
  form: FormGroup,
  isLoading: boolean
): boolean {
  if (form.invalid) {
    form.markAllAsTouched();
    return false;
  }

  return !isLoading;
}

export function startSubmission(submissionState: SubmissionState): void {
  submissionState.isLoading.set(true);
  submissionState.error.set(null);
  submissionState.isSuccess.set(false);
}

export async function simulateApiDelay(milliseconds = 1500): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function extractFormData<T>(form: FormGroup): T {
  return form.getRawValue() as T;
}