export interface VerifyEmailStateModel {
  email: string;
  role: 'mentee' | 'mentor' | '';
  message: string;
  
  isResendLoading: boolean;
  resendError: string | null;
}

export const initialVerifyEmailState: VerifyEmailStateModel = {
  email: '',
  role: '',
  message: '',
  
  isResendLoading: false,
  resendError: null,
};
