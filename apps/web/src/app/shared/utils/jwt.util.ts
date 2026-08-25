/**
 * Supabase access tokens live about an hour. A tab left open overnight sends
 * a token that is guaranteed to fail — and when that request carries a
 * multipart body, the rejection can be lost in transit (issue #395). Reading
 * `exp` locally lets the client refresh first instead of finding out the hard
 * way.
 *
 * An unreadable token is never reported as expired: only the API can judge a
 * token it cannot parse here.
 */
const DEFAULT_CLOCK_SKEW_MS = 30_000;

function decodeBase64Url(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
}

/** Expiry as epoch milliseconds, or `null` if the token carries no numeric `exp`. */
export function getTokenExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewMs: number = DEFAULT_CLOCK_SKEW_MS): boolean {
  const expiresAt = getTokenExpiry(token);
  if (expiresAt === null) {
    return false;
  }

  return Date.now() + skewMs >= expiresAt;
}
