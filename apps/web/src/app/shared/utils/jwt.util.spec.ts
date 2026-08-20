import { getTokenExpiry, isTokenExpired } from './jwt.util';

function makeToken(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'ES256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('jwt.util', () => {
  it('reads exp as epoch milliseconds', () => {
    expect(getTokenExpiry(makeToken({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });

  it('returns null for a token that is not three dot-separated parts', () => {
    expect(getTokenExpiry('not-a-jwt')).toBeNull();
  });

  it('returns null when the payload is not valid base64url JSON', () => {
    expect(getTokenExpiry('aaa.!!!not-base64!!!.ccc')).toBeNull();
  });

  it('returns null when exp is missing or not a number', () => {
    expect(getTokenExpiry(makeToken({ sub: 'abc' }))).toBeNull();
    expect(getTokenExpiry(makeToken({ exp: 'soon' }))).toBeNull();
  });

  it('treats a token that expired days ago as expired', () => {
    const threeDaysAgo = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60;
    expect(isTokenExpired(makeToken({ exp: threeDaysAgo }))).toBe(true);
  });

  it('treats a token expiring inside the clock-skew window as expired', () => {
    const inTenSeconds = Math.floor(Date.now() / 1000) + 10;
    expect(isTokenExpired(makeToken({ exp: inTenSeconds }), 30_000)).toBe(true);
  });

  it('treats a comfortably valid token as live', () => {
    const inOneHour = Math.floor(Date.now() / 1000) + 3600;
    expect(isTokenExpired(makeToken({ exp: inOneHour }))).toBe(false);
  });

  it('does not claim an unparseable token is expired — the server decides', () => {
    expect(isTokenExpired('garbage')).toBe(false);
  });
});
