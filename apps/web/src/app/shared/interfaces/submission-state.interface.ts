import { WritableSignal } from '@angular/core';

export interface SubmissionState {
  isLoading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  isSuccess: WritableSignal<boolean>;
}
