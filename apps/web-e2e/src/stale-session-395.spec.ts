import { test, expect, Page } from '@playwright/test';

/**
 * Regression coverage for issue #395 — "Mentor post log-in stuck for days but
 * successfully setup on other browser/tab".
 *
 * A mentor left a tab open on /profile-setup for days and completed their
 * mentor profile in a different browser. Returning to the old tab, refreshing,
 * and even deleting "/profile-setup" from the URL all failed: they were pinned
 * to the setup page permanently. The app derived identity solely from the
 * `auth_user` snapshot written to localStorage at login and never asked the
 * server anything — the recording on the issue shows 41 requests after a
 * reload, all static assets, zero API calls.
 *
 * These tests recreate that exact state: a *stale* snapshot claiming the mentor
 * profile is incomplete, paired with a real session, and assert the app now
 * corrects itself from GET /auth/session instead of looping.
 *
 * Requires a mentor account whose profile IS complete server-side, so the
 * stale snapshot and the server disagree — that disagreement is the bug.
 * Credentials come from the environment; the suite skips when they are absent
 * so CI without secrets stays green rather than failing noisily.
 *
 * Running it locally:
 *
 *   npx nx serve api
 *   npx nx serve web --configuration=local      # NOT the default!
 *   cd apps/web-e2e && E2E_MENTOR_EMAIL=… E2E_MENTOR_PASSWORD=… \
 *     npx playwright test --project=chromium --grep "issue #395"
 *
 * The `--configuration=local` matters: `environment.ts`, which the default
 * `serve` uses, points at https://test-api.gurokonekt.com. Against staging
 * these tests fail for a reason that has nothing to do with the fix — until
 * the API half of this branch is deployed, /auth/session 404s there, and the
 * app (correctly) keeps the cached session rather than logging the user out.
 * `environment.local.ts` is the one that points at http://localhost:3000/api.
 *
 * Verified to be a real regression test: all three cases fail against the
 * pre-fix code on `main` (revert `auth.state.ts` and `app.config.ts` to see it)
 * and pass with the fix in place.
 */

const API_URL = process.env['E2E_API_URL'] || 'http://localhost:3000/api';
const MENTOR_EMAIL = process.env['E2E_MENTOR_EMAIL'];
const MENTOR_PASSWORD = process.env['E2E_MENTOR_PASSWORD'];

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

interface Session {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isProfileComplete: boolean;
    isMentorProfileComplete: boolean;
  };
}

async function login(request: import('@playwright/test').APIRequestContext): Promise<Session> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: MENTOR_EMAIL, password: MENTOR_PASSWORD },
  });

  const body = await response.json();
  const user = body.data?.user ?? body.data?.auth?.user;
  const session = body.data?.session ?? body.data;

  expect(user, `login failed: ${JSON.stringify(body)}`).toBeTruthy();
  expect(
    user.isMentorProfileComplete,
    'this fixture needs a mentor whose profile is already complete server-side, ' +
      'so the stale snapshot and the server disagree'
  ).toBe(true);

  return {
    accessToken: session.access_token ?? session.accessToken,
    refreshToken: session.refresh_token ?? session.refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      isMentorProfileComplete: user.isMentorProfileComplete,
    },
  };
}

/**
 * Writes the state the stuck tab held: a real token, but a snapshot of the user
 * taken *before* the profile was completed elsewhere.
 */
async function seedStaleSession(page: Page, session: Session, token: string) {
  await page.addInitScript(
    ([tokenKey, refreshKey, userKey, accessToken, refreshToken, staleUser]) => {
      localStorage.setItem(tokenKey as string, accessToken as string);
      localStorage.setItem(refreshKey as string, refreshToken as string);
      localStorage.setItem(userKey as string, staleUser as string);
    },
    [
      TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_KEY,
      token,
      session.refreshToken,
      JSON.stringify({ ...session.user, isMentorProfileComplete: false }),
    ]
  );
}

test.describe('issue #395 — stale session must not pin a mentor to profile-setup', () => {
  test.skip(
    !MENTOR_EMAIL || !MENTOR_PASSWORD,
    'set E2E_MENTOR_EMAIL and E2E_MENTOR_PASSWORD to run'
  );

  test('a days-stale snapshot is corrected from the server on load', async ({
    page,
    request,
  }) => {
    const session = await login(request);
    await seedStaleSession(page, session, session.accessToken);

    const sessionCalls: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/auth/session')) sessionCalls.push(r.url());
    });

    // The reporter's step 11: open the site with no path at all.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The core of the bug: before the fix this reload made zero API calls.
    expect(
      sessionCalls.length,
      'bootstrap must ask the server who the user is'
    ).toBeGreaterThan(0);

    // And the stale snapshot must lose to the server's answer.
    expect(page.url()).not.toContain('/profile-setup');

    const storedUser = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      USER_KEY
    );
    expect(
      storedUser.isMentorProfileComplete,
      'the cached snapshot must be rewritten with the server value'
    ).toBe(true);
  });

  test('navigating straight to /profile-setup redirects away once revalidated', async ({
    page,
    request,
  }) => {
    const session = await login(request);
    await seedStaleSession(page, session, session.accessToken);

    // The reporter's step 10: land directly on the stuck page.
    await page.goto('/profile-setup');
    await page.waitForLoadState('networkidle');

    expect(
      page.url(),
      'a mentor who already finished setup must not be held on the setup page'
    ).not.toContain('/profile-setup');
  });

  test('an expired token sends the mentor to login, not back to profile-setup', async ({
    page,
    request,
  }) => {
    const session = await login(request);

    // Same shape as a token that expired days ago while the tab sat open:
    // structurally valid, correctly signed segments, but long past `exp`.
    const [header, payload, signature] = session.accessToken.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    decoded.exp = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 3;
    const expired = [
      header,
      Buffer.from(JSON.stringify(decoded)).toString('base64url').replace(/=+$/, ''),
      signature,
    ].join('.');

    await seedStaleSession(page, session, expired);
    // A dead refresh token, so the refresh cannot rescue the session either.
    await page.addInitScript(
      ([key]) => localStorage.setItem(key as string, 'expired-refresh-token'),
      [REFRESH_TOKEN_KEY]
    );

    await page.goto('/');
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    expect(page.url()).toContain('/login');
    expect(page.url()).not.toContain('/profile-setup');

    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token, 'a rejected session must be cleared, not left behind').toBeNull();
  });
});
