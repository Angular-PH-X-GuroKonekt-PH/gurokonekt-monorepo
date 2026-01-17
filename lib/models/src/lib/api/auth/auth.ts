export interface SignInInputInterface {
  email: string;
  password: string;
}

export interface SignUpOptionsInterface {
    emailRedirectTo: string;
}

export interface SignUpInputInterface {
  email: string;
  password: string;
  options: SignUpOptionsInterface | null;
}

export interface ResendEmailSignUpConfirmation {
    email: string;
    options: SignUpOptionsInterface | null;
}

export interface ResendEmailChangeEmail {
    email: string;
}

export enum SignInWithOAthProviders {
    Google = 'google',
    Github = 'github',
}

export interface SignInWithOAth {
    provider: SignInWithOAthProviders;
    options: SignUpOptionsInterface | null;
}

export interface UpdateEmailForAnAuthenticatedUser {
    email: string;
}

export interface UpdatePasswordForAnAuthenticatedUser {
    password: string;
}
