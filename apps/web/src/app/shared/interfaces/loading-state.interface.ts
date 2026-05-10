import { WritableSignal } from '@angular/core';

export interface LoadingState {
  isLoading: WritableSignal<boolean>;
  errorMessage: WritableSignal<string>;
  successMessage: WritableSignal<string>;
}
