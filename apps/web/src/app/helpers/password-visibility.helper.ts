import { signal, WritableSignal } from '@angular/core';

export interface PasswordVisibilityState {
  showPassword: WritableSignal<boolean>;
  showConfirmPassword?: WritableSignal<boolean>;
}

/**
 * Helper class for managing password visibility states in forms
 */
export class PasswordVisibilityHelper {
  public readonly showPassword = signal(false);
  public readonly showConfirmPassword = signal(false);

  /**
   * Get password visibility signals
   */
  getPasswordVisibility(): PasswordVisibilityState {
    return {
      showPassword: this.showPassword,
      showConfirmPassword: this.showConfirmPassword,
    };
  }

  /**
   * Toggle main password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  /**
   * Alias for togglePasswordVisibility (for backward compatibility)
   */
  toggleVisibility(): void {
    this.togglePasswordVisibility();
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  /**
   * Reset all password visibility to false
   */
  resetPasswordVisibility(): void {
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }
}