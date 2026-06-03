import { AdminUser } from '../../storage/auth-storage.service';

export interface AuthStateModel {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoginLoading: boolean;
  isLoading: boolean;
  successMessage: string | null;
  errorMessage: string | null;
}

export const initialAuthState: AuthStateModel = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoginLoading: false,
  isLoading: false,
  successMessage: null,
  errorMessage: null,
};
