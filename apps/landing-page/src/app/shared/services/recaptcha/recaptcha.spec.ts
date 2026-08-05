import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Recaptcha, RECAPTCHA_SCRIPT_ID, RecaptchaUnavailableError } from './recaptcha';
import { APP_CONFIG } from '../../../../environments/app-config.token';
import { EnvironmentModel } from '../../../../environments/environment.model';

const baseConfig = {
  CONTENTFUL_SPACE: 'space',
  CONTENTFUL_ACCESS_TOKEN: 'token',
  CONTENTFUL_EVENTS: 'events',
  SIGN_IN_URL: 'https://example.com/login',
  REGISTER_URL: 'https://example.com/login',
  API_URL: 'https://test-api.example.com/api',
  RECAPTCHA_SITE_KEY: 'site-key',
} satisfies EnvironmentModel;

function build(
  config: EnvironmentModel = baseConfig,
  platform: object = 'browser',
): Recaptcha {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: APP_CONFIG, useValue: config },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return TestBed.inject(Recaptcha);
}

/** Simulates Google's script registering itself once appended. */
function autoResolveScript(token = 'token-abc') {
  const original = document.head.appendChild.bind(document.head);
  vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
    const result = original(node);
    (window as any).grecaptcha = {
      ready: (cb: () => void) => cb(),
      execute: () => Promise.resolve(token),
    };
    node.onload?.();
    return result;
  });
}

describe('Recaptcha', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).grecaptcha;
    document.getElementById(RECAPTCHA_SCRIPT_ID)?.remove();
  });

  it('reports whether a site key is configured', () => {
    expect(build().isConfigured).toBe(true);
    expect(build({ ...baseConfig, RECAPTCHA_SITE_KEY: '' }).isConfigured).toBe(false);
  });

  it('returns a token once the script loads', async () => {
    autoResolveScript('token-xyz');

    await expect(build().execute('contact_form')).resolves.toBe('token-xyz');
  });

  it('injects the script only once across repeated calls', async () => {
    autoResolveScript();
    const service = build();

    await service.execute('contact_form');
    await service.execute('contact_form');

    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
  });

  // The landing page prerenders every route; touching `document` on the server
  // would crash the build.
  it('refuses to run on the server', async () => {
    await expect(build(baseConfig, 'server').execute('contact_form')).rejects.toBeInstanceOf(
      RecaptchaUnavailableError,
    );
  });

  it('rejects when no site key is configured', async () => {
    await expect(
      build({ ...baseConfig, RECAPTCHA_SITE_KEY: '' }).execute('contact_form'),
    ).rejects.toBeInstanceOf(RecaptchaUnavailableError);
  });

  // Ad blockers and privacy extensions routinely block this script.
  it('rejects when the script fails to load', async () => {
    const original = document.head.appendChild.bind(document.head);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
      const result = original(node);
      node.onerror?.();
      return result;
    });

    await expect(build().execute('contact_form')).rejects.toBeInstanceOf(
      RecaptchaUnavailableError,
    );
  });
});
