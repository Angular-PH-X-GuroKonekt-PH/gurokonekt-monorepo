import {
  hasEmailVerificationCallbackHash,
  resolveEmailVerificationOutcome,
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
});
