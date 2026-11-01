/** The ways a user can sign in to their GuroKonekt account. */
export interface SignInMethodsInterface {
  password: boolean;
  google: { connected: boolean; email: string | null };
  passkeys: number;
}

/** Tokens that replace the stored ones after a link change. */
export interface SignInMethodsSessionInterface {
  accessToken: string;
  refreshToken: string;
}

export interface SignInMethodsChangeInterface {
  methods: SignInMethodsInterface;
  session: SignInMethodsSessionInterface | null;
}
