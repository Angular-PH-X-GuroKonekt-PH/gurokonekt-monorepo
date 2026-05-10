import { LoadingState } from './loading-state.interface';

export interface LoadingStateController {
  state: LoadingState;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (message: string) => void;
  setSuccess: (message: string) => void;
  clearMessages: () => void;
  reset: () => void;
  isCurrentlyLoading: () => boolean;
  hasError: () => boolean;
  hasSuccess: () => boolean;
}
