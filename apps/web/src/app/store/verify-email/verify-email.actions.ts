export class InitializeVerification {
  static readonly type = '[VerifyEmail] Initialize Verification';
  constructor(
    public payload: { 
      email: string; 
      role: 'mentee' | 'mentor' | ''; 
      message: string 
    }
  ) {}
}

export class ResendVerificationEmail {
  static readonly type = '[VerifyEmail] Resend Verification Email';
}

export class ResendVerificationEmailSuccess {
  static readonly type = '[VerifyEmail] Resend Verification Email Success';
}

export class ResendVerificationEmailFailure {
  static readonly type = '[VerifyEmail] Resend Verification Email Failure';
  constructor(public error: string) {}
}

export class ResetVerificationMessage {
  static readonly type = '[VerifyEmail] Reset Verification Message';
}
