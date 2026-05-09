export interface AuthStateModel {
  user: { id: string; email: string; role: string; [key: string]: unknown } | null;
  token: string | null;
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
  isAuthenticated: false,
  
  isLoading: false,
  isLoginLoading: false,
  isMenteeRegisterLoading: false,
  isMentorRegisterLoading: false,
  
  successMessage: null,
  errorMessage: null,
  
  lastRegisteredEmail: null,
};