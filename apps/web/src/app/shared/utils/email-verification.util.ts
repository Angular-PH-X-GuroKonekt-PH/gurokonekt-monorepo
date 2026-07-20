import { APP_ROUTES } from '../constants/routes';

export type EmailVerificationOutcome = 'success' | 'expired' | 'already-verified';

const LOCAL_DEV_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Reads Supabase auth callback parameters from the URL hash or query string.
 */
export function getEmailVerificationParams(): URLSearchParams {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (hash.length > 1) {
    return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  }

  const search = typeof window !== 'undefined' ? window.location.search : '';
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

/**
 * Maps Supabase redirect fragments to a verification outcome for routing.
 */
export function resolveEmailVerificationOutcome(
  params = getEmailVerificationParams()
): EmailVerificationOutcome | null {
  const error = params.get('error');
  const errorCode = (params.get('error_code') ?? '').toLowerCase();
  const errorDescription = (params.get('error_description') ?? '').toLowerCase();
  const accessToken = params.get('access_token');
  const type = params.get('type');

  // Password recovery callbacks belong to the reset-password flow.
  if (type === 'recovery') {
    return null;
  }

  if (accessToken && !error) {
    return 'success';
  }

  if (type === 'signup' && !error && params.get('token_hash')) {
    return 'success';
  }

  if (!error) {
    return null;
  }

  if (
    errorDescription.includes('already confirmed') ||
    errorDescription.includes('already verified') ||
    errorDescription.includes('email already') ||
    errorCode === 'email_already_confirmed' ||
    errorCode === 'email_already_verified'
  ) {
    return 'already-verified';
  }

  // Verification link clicked again after the email was confirmed
  if (
    errorDescription.includes('already been used') ||
    errorDescription.includes('link has already')
  ) {
    return 'already-verified';
  }

  if (
    errorCode === 'otp_expired' ||
    errorDescription.includes('expired') ||
    errorDescription.includes('invalid')
  ) {
    return 'expired';
  }

  return 'expired';
}

/**
 * Supabase returns auth results in the URL hash. True when the current URL
 * contains signup verification callback parameters.
 */
export function hasEmailVerificationCallbackHash(
  hash = typeof window !== 'undefined' ? window.location.hash : ''
): boolean {
  if (!hash || hash.length <= 1) {
    return false;
  }

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  if (params.get('type') === 'recovery') {
    return false;
  }

  return (
    params.has('access_token') ||
    params.has('error') ||
    (params.get('type') === 'signup' && params.has('token_hash'))
  );
}

/**
 * True when Supabase returned a password-recovery callback in the URL hash.
 */
export function hasPasswordRecoveryCallbackHash(
  hash = typeof window !== 'undefined' ? window.location.hash : ''
): boolean {
  if (!hash || hash.length <= 1) {
    return false;
  }

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  return params.get('type') === 'recovery';
}

/**
 * Sends the browser to the verify-email callback route with the current hash intact.
 * Use when Supabase redirects to /login (or another route) instead of /verify-email.
 */
export function redirectToVerifyEmailCallback(): void {
  const hash = window.location.hash;
  window.location.replace(`/${APP_ROUTES.VERIFY_EMAIL}${hash}`);
}

/**
 * Sends a recovery callback to the reset-password route with its hash intact.
 */
export function redirectToPasswordRecoveryCallback(): void {
  const hash = window.location.hash;
  window.location.replace(`/${APP_ROUTES.RESET_PASSWORD}${hash}`);
}

/**
 * Redirect URL for confirmation emails. Omitted on localhost so the API can build
 * the URL from the request Origin header (avoids strict @IsUrl validation on deployed API).
 */
export function buildVerifyEmailRedirectUrl(
  origin = window.location.origin
): string | undefined {
  const base = (origin || '').replace(/\/$/, '');
  if (!base || LOCAL_DEV_ORIGIN.test(base)) {
    return undefined;
  }
  return `${base}/${APP_ROUTES.VERIFY_EMAIL}`;
}
