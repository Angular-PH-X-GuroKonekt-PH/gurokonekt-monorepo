/**
 * Ensures the signup verification redirect URL carries the recipient email
 * as a query param so the app can resend after the link expires.
 */
export function withVerificationEmailQuery(
  redirectTo: string,
  email: string
): string {
  const normalizedEmail = email.toLowerCase().trim();
  if (!redirectTo || !normalizedEmail) {
    return redirectTo;
  }

  if (/^https?:\/\//i.test(redirectTo)) {
    const url = new URL(redirectTo);
    url.searchParams.set('email', normalizedEmail);
    return url.toString();
  }

  const base = new URL(redirectTo, 'http://verification.local');
  base.searchParams.set('email', normalizedEmail);
  return `${base.pathname}${base.search}${base.hash}`;
}
