import {
  hasEmailVerificationCallbackHash,
  hasPasswordRecoveryCallbackHash,
  resolveEmailVerificationOutcome,
  withVerificationEmailQuery,
  getVerificationEmailFromCallback,
  buildVerifyEmailRedirectUrl,
} from './email-verification.util';

describe('resolveEmailVerificationOutcome', () => {
  it('returns success when access_token is present without error', () => {
    const params = new URLSearchParams(
      'access_token=abc&refresh_token=def&type=signup&token_type=bearer'
    );

    expect(resolveEmailVerificationOutcome(params)).toBe('success');
  });

  it('returns expired for otp_expired error', () => {
    const params = new URLSearchParams(
      'error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    );

    expect(resolveEmailVerificationOutcome(params)).toBe('expired');
  });

  it('returns already-verified when error description mentions already confirmed', () => {
    const params = new URLSearchParams(
      'error=access_denied&error_code=403&error_description=Email+is+already+confirmed'
    );

    expect(resolveEmailVerificationOutcome(params)).toBe('already-verified');
  });

  it('returns already-verified when verification link was already used', () => {
    const params = new URLSearchParams(
      'error=access_denied&error_description=Email+link+has+already+been+used'
    );

    expect(resolveEmailVerificationOutcome(params)).toBe('already-verified');
  });

  it('returns null when no auth params are present', () => {
    expect(resolveEmailVerificationOutcome(new URLSearchParams())).toBeNull();
  });

  it('does not treat a recovery callback as email verification', () => {
    const params = new URLSearchParams(
      'access_token=abc&type=recovery&token_type=bearer'
    );

    expect(resolveEmailVerificationOutcome(params)).toBeNull();
  });
});

describe('hasEmailVerificationCallbackHash', () => {
  it('returns true when access_token is in the hash', () => {
    expect(
      hasEmailVerificationCallbackHash('#access_token=abc&type=signup')
    ).toBe(true);
  });

  it('returns false when hash is empty', () => {
    expect(hasEmailVerificationCallbackHash('')).toBe(false);
  });

  it('returns false for a password recovery callback', () => {
    expect(
      hasEmailVerificationCallbackHash('#access_token=abc&type=recovery')
    ).toBe(false);
  });
});

describe('hasPasswordRecoveryCallbackHash', () => {
  it('returns true for a recovery callback', () => {
    expect(
      hasPasswordRecoveryCallbackHash('#access_token=abc&type=recovery')
    ).toBe(true);
  });

  it('returns false for a signup callback', () => {
    expect(
      hasPasswordRecoveryCallbackHash('#access_token=abc&type=signup')
    ).toBe(false);
  });
});

describe('withVerificationEmailQuery', () => {
  it('appends email to an absolute verify-email URL', () => {
    expect(
      withVerificationEmailQuery(
        'https://app.gurokonekt.com/verify-email',
        'Mentor@Example.com'
      )
    ).toBe('https://app.gurokonekt.com/verify-email?email=mentor%40example.com');
  });

  it('replaces an existing email query param', () => {
    expect(
      withVerificationEmailQuery(
        'https://app.gurokonekt.com/verify-email?email=old%40example.com',
        'new@example.com'
      )
    ).toBe('https://app.gurokonekt.com/verify-email?email=new%40example.com');
  });

  it('appends email to a relative path', () => {
    expect(withVerificationEmailQuery('/verify-email', 'a@b.com')).toBe(
      '/verify-email?email=a%40b.com'
    );
  });
});

describe('getVerificationEmailFromCallback', () => {
  it('reads email from the query string even when hash has error params', () => {
    expect(
      getVerificationEmailFromCallback(
        '?email=mentor%40example.com',
        new URLSearchParams(
          'error=access_denied&error_code=otp_expired&error_description=expired'
        )
      )
    ).toBe('mentor@example.com');
  });

  it('falls back to email in hash params when query is empty', () => {
    expect(
      getVerificationEmailFromCallback(
        '',
        new URLSearchParams('email=fallback%40example.com')
      )
    ).toBe('fallback@example.com');
  });
});

describe('buildVerifyEmailRedirectUrl', () => {
  it('returns undefined for localhost origins', () => {
    expect(
      buildVerifyEmailRedirectUrl('a@b.com', 'http://localhost:4200')
    ).toBeUndefined();
  });

  it('embeds email for non-local origins', () => {
    expect(
      buildVerifyEmailRedirectUrl('A@B.com', 'https://app.gurokonekt.com')
    ).toBe('https://app.gurokonekt.com/verify-email?email=a%40b.com');
  });
});
