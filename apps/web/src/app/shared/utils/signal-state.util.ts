import { signal } from '@angular/core';

/**
 * Helper for managing common signal patterns and state updates
 */
export function createLoadingState(initialState = false) {
  const isLoading = signal(initialState);

  return {
    isLoading: isLoading.asReadonly(),
    setLoading: (state: boolean) => isLoading.set(state),
    startLoading: () => isLoading.set(true),
    stopLoading: () => isLoading.set(false),
  };
}

  /**
   * Create an error message state signal with helper methods
   */
export function createErrorState(initialMessage = '') {
  const errorMessage = signal(initialMessage);

  return {
    errorMessage: errorMessage.asReadonly(),
    setError: (message: string) => errorMessage.set(message),
    clearError: () => errorMessage.set(''),
    hasError: () => !!errorMessage(),
  };
}

  /**
   * Create a success message state signal with helper methods
   */
export function createSuccessState(initialMessage = '') {
  const successMessage = signal(initialMessage);

  return {
    successMessage: successMessage.asReadonly(),
    setSuccess: (message: string) => successMessage.set(message),
    clearSuccess: () => successMessage.set(''),
    hasSuccess: () => !!successMessage(),
  };
}

  /**
   * Create a visibility state signal (for modals, dropdowns, etc.)
   */
export function createVisibilityState(initialState = false) {
  const isVisible = signal(initialState);

  return {
    isVisible: isVisible.asReadonly(),
    show: () => isVisible.set(true),
    hide: () => isVisible.set(false),
    toggle: () => isVisible.update((state) => !state),
  };
}

  /**
   * Create a form state bundle with common patterns
   */
export function createFormState() {
  const loading = createLoadingState();
  const error = createErrorState();
  const success = createSuccessState();

  return {
    ...loading,
    ...error,
    ...success,
    reset: () => {
      loading.stopLoading();
      error.clearError();
      success.clearSuccess();
    },
  };
}

  /**
   * Batch update multiple signals safely
   */
export function batchUpdate(updates: Array<() => void>): void {
  updates.forEach((update) => {
      try {
        update();
      } catch (error) {
        console.error('Signal update failed:', error);
      }
    });
}

  /**
   * Create a step navigation state for multi-step forms
   */
export function createStepperState(totalSteps: number, initialStep = 1) {
  const currentStep = signal(initialStep);

  return {
    currentStep: currentStep.asReadonly(),
    goToStep: (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        currentStep.set(step);
      }
    },
    nextStep: () => {
      if (currentStep() < totalSteps) {
        currentStep.update((step) => step + 1);
      }
    },
    previousStep: () => {
      if (currentStep() > 1) {
        currentStep.update((step) => step - 1);
      }
    },
    isFirstStep: () => currentStep() === 1,
    isLastStep: () => currentStep() === totalSteps,
    getProgress: () => Math.round((currentStep() / totalSteps) * 100),
  };
}

  /**
   * Creates a standardized submission state object
   */
export function createSubmissionState() {
  return {
    isLoading: signal(false),
    error: signal<string | null>(null),
    isSuccess: signal(false),
  };
}