const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';

// Only in-app settings pages: a stored value can never send anyone off-site.
const ALLOWED_REDIRECT = /^\/settings\/[a-z-]+$/;

/**
 * Remembers a page to return to after the next sign-in, e.g. when removing a
 * passkey asks the person to sign in again.
 */
export function rememberPostLoginRedirect(url: string): void {
  if (!ALLOWED_REDIRECT.test(url)) return;
  try {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, url);
  } catch {
    // Storage blocked: they land on the dashboard instead.
  }
}

/** Returns the remembered page once, then forgets it. */
export function consumePostLoginRedirect(): string | null {
  try {
    const url = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return url && ALLOWED_REDIRECT.test(url) ? url : null;
  } catch {
    return null;
  }
}
