import { consumePostLoginRedirect, rememberPostLoginRedirect } from './post-login-redirect.util';

describe('post-login redirect', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns to a remembered settings page once', () => {
    rememberPostLoginRedirect('/settings/passkeys');

    expect(consumePostLoginRedirect()).toBe('/settings/passkeys');
    expect(consumePostLoginRedirect()).toBeNull();
  });

  it.each(['https://evil.example.com', '//evil.example.com', '/dashboard', '/settings/../admin', 'settings/passkeys'])(
    'ignores %s, which is not an in-app settings page',
    (url) => {
      rememberPostLoginRedirect(url);
      expect(consumePostLoginRedirect()).toBeNull();
    }
  );

  it('ignores a tampered value in storage', () => {
    sessionStorage.setItem('post_login_redirect', 'https://evil.example.com');

    expect(consumePostLoginRedirect()).toBeNull();
  });
});
