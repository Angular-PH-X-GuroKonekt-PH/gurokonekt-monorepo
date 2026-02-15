import { signal, WritableSignal } from '@angular/core';

export interface LoadingState {
  isLoading: WritableSignal<boolean>;
  errorMessage: WritableSignal<string>;
  successMessage: WritableSignal<string>;
}

/**
 * Helper class for managing loading states and messages in components
 */
export class LoadingStateHelper {
  public readonly isLoading = signal(false);
  private errorMessage = signal<string>('');
  private successMessage = signal<string>('');

  /**
   * Get all loading state signals
   */
  getLoadingState(): LoadingState {
    return {
      isLoading: this.isLoading,
      errorMessage: this.errorMessage,
      successMessage: this.successMessage,
    };
  }

  /**
   * Start loading state
   */
  startLoading(): void {
    this.isLoading.set(true);
    this.clearMessages();
  }

  /**
   * Stop loading state
   */
  stopLoading(): void {
    this.isLoading.set(false);
  }

  /**
   * Set error message and stop loading
   */
  setError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    this.isLoading.set(false);
  }

  /**
   * Set success message and stop loading
   */
  setSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    this.isLoading.set(false);
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Clear all state
   */
  reset(): void {
    this.isLoading.set(false);
    this.clearMessages();
  }

  /**
   * Check if currently loading
   */
  isCurrentlyLoading(): boolean {
    return this.isLoading();
  }

  /**
   * Check if has error
   */
  hasError(): boolean {
    return this.errorMessage().length > 0;
  }

  /**
   * Check if has success message
   */
  hasSuccess(): boolean {
    return this.successMessage().length > 0;
  }
}