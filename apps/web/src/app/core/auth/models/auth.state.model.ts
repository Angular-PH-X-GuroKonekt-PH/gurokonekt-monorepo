import { AuthUser } from '@gurokonekt/models/interfaces/auth/auth-user.interface';

export interface AuthStateModel {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  isLoading: boolean;
  isLoginLoading: boolean;
  isMenteeRegisterLoading: boolean;
  isMentorRegisterLoading: boolean;

  successMessage: string | null;
  errorMessage: string | null;

  lastRegisteredEmail: string | null;
}

export const initialAuthState: AuthStateModel = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  isLoading: false,
  isLoginLoading: false,
  isMenteeRegisterLoading: false,
  isMentorRegisterLoading: false,

  successMessage: null,
  errorMessage: null,

  lastRegisteredEmail: null,
};
