import { signal, WritableSignal } from '@angular/core';

export interface PasswordVisibilityState {
  showPassword: WritableSignal<boolean>;
  showConfirmPassword: WritableSignal<boolean>;
  togglePasswordVisibility: () => void;
  toggleVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  resetPasswordVisibility: () => void;
}

/**
 * Utility factory for managing password visibility states in forms
 */
export function createPasswordVisibilityState(): PasswordVisibilityState {
  const showPassword = signal(false);
  const showConfirmPassword = signal(false);

  const togglePasswordVisibility = (): void => {
    showPassword.update((value) => !value);
  };

  return {
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleVisibility: togglePasswordVisibility,
    toggleConfirmPasswordVisibility: (): void => {
      showConfirmPassword.update((value) => !value);
    },
    resetPasswordVisibility: (): void => {
      showPassword.set(false);
      showConfirmPassword.set(false);
    },
  };
}