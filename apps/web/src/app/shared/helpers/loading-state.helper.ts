import { signal, WritableSignal } from '@angular/core';
import { LoadingState } from '../interfaces/loading-state.interface';
import { LoadingStateController } from '../interfaces/loading-state-controller.interface';

/**
 * Helper functions for managing loading states and messages in components
 */

export function createLoadingStateController(): LoadingStateController {
  const isLoading = signal(false);
  const errorMessage = signal<string>('');
  const successMessage = signal<string>('');

  const state: LoadingState = {
    isLoading,
    errorMessage,
    successMessage,
  };

  const clearMessages = (): void => {
    errorMessage.set('');
    successMessage.set('');
  };

  return {
    state,
    startLoading: (): void => {
      isLoading.set(true);
      clearMessages();
    },
    stopLoading: (): void => {
      isLoading.set(false);
    },
    setError: (message: string): void => {
      errorMessage.set(message);
      successMessage.set('');
      isLoading.set(false);
    },
    setSuccess: (message: string): void => {
      successMessage.set(message);
      errorMessage.set('');
      isLoading.set(false);
    },
    clearMessages,
    reset: (): void => {
      isLoading.set(false);
      clearMessages();
    },
    isCurrentlyLoading: (): boolean => isLoading(),
    hasError: (): boolean => errorMessage().length > 0,
    hasSuccess: (): boolean => successMessage().length > 0,
  };
}