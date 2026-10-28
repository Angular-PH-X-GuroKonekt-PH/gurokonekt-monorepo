import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

const browser = vi.hoisted(() => ({
  startRegistration: vi.fn(),
  browserSupportsWebAuthn: vi.fn(() => true),
}));

vi.mock('@simplewebauthn/browser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@simplewebauthn/browser')>();
  return { ...actual, startRegistration: browser.startRegistration, browserSupportsWebAuthn: browser.browserSupportsWebAuthn };
});

import { WebAuthnError } from '@simplewebauthn/browser';
import { describeThisDevice, PasskeyService } from './passkey.service';

const OPTIONS = { challenge: 'server-challenge', rp: { id: 'localhost', name: 'GuroKonekt' } };
const BROWSER_RESPONSE = { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: {} };
const SAVED = { id: 'passkey-1', name: 'Chrome on Windows', deviceType: 'multiDevice', backedUp: true, createdAt: '2026-10-08' };

describe('PasskeyService', () => {
  let service: PasskeyService;
  let httpMock: HttpTestingController;

  // Answers the options request, then lets the browser step settle before the test continues.
  const answerOptions = async () => {
    httpMock.expectOne((req) => req.url.endsWith('/auth/passkeys/registration/options')).flush({ data: OPTIONS });
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PasskeyService);
    httpMock = TestBed.inject(HttpTestingController);
    browser.startRegistration.mockResolvedValue(BROWSER_RESPONSE);
  });

  afterEach(() => httpMock.verify());

  it('gets options, runs the device prompt, then saves the passkey with its name', async () => {
    const result = service.register('Chrome on Windows');
    await answerOptions();

    expect(browser.startRegistration).toHaveBeenCalledWith({ optionsJSON: OPTIONS });
    const verify = httpMock.expectOne((req) => req.url.endsWith('/auth/passkeys/registration/verify'));
    expect(verify.request.body).toEqual({ response: BROWSER_RESPONSE, name: 'Chrome on Windows' });
    verify.flush({ message: 'Your passkey has been added.', data: SAVED });

    expect(await result).toEqual({ status: 'added', passkey: SAVED, message: 'Your passkey has been added.' });
  });

  it('treats a closed or timed-out device prompt as cancelled, not an error', async () => {
    browser.startRegistration.mockRejectedValue(Object.assign(new Error('closed'), { name: 'NotAllowedError' }));

    const result = service.register('Chrome on Windows');
    await answerOptions();

    expect(await result).toEqual({ status: 'cancelled' });
    httpMock.expectNone((req) => req.url.endsWith('/registration/verify'));
  });

  it('explains when this device already has a passkey for the account', async () => {
    browser.startRegistration.mockRejectedValue(
      new WebAuthnError({
        message: 'already registered',
        code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
        cause: new Error('InvalidStateError'),
      })
    );

    const result = service.register('Chrome on Windows');
    await answerOptions();

    expect(await result).toEqual({ status: 'failed', message: 'This device already has a passkey for your account.' });
  });

  it("shows the server's reason when saving fails", async () => {
    const result = service.register('Chrome on Windows');
    await answerOptions();

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/passkeys/registration/verify'))
      .flush({ message: 'Passkey setup timed out. Please try again.' }, { status: 400, statusText: 'Bad Request' });

    expect(await result).toEqual({ status: 'failed', message: 'Passkey setup timed out. Please try again.' });
  });

  it('does not open the device prompt when the server refuses to start', async () => {
    const result = service.register('Chrome on Windows');
    httpMock
      .expectOne((req) => req.url.endsWith('/auth/passkeys/registration/options'))
      .flush({ message: 'Passkeys are not available for this account.' }, { status: 403, statusText: 'Forbidden' });

    expect(await result).toEqual({ status: 'failed', message: 'Passkeys are not available for this account.' });
    expect(browser.startRegistration).not.toHaveBeenCalled();
  });

  it("lists the user's passkeys", async () => {
    const result = service.list();
    httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/auth/passkeys')).flush({ data: [SAVED] });

    expect(await result).toEqual([SAVED]);
  });

  it('renames a passkey', async () => {
    const result = service.rename('passkey-1', 'Work laptop');
    const request = httpMock.expectOne((req) => req.method === 'PATCH' && req.url.endsWith('/auth/passkeys/passkey-1'));
    expect(request.request.body).toEqual({ name: 'Work laptop' });
    request.flush({ message: 'Passkey renamed.', data: { ...SAVED, name: 'Work laptop' } });

    expect(await result).toEqual({ status: 'done', data: { ...SAVED, name: 'Work laptop' }, message: 'Passkey renamed.' });
  });

  it('removes a passkey', async () => {
    const result = service.remove('passkey-1');
    httpMock
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/auth/passkeys/passkey-1'))
      .flush({ message: 'Passkey removed. It can no longer be used to sign in.', data: { id: 'passkey-1' } });

    expect(await result).toEqual({ status: 'done', data: null, message: 'Passkey removed. It can no longer be used to sign in.' });
  });

  it('asks to sign in again when the sign-in is too old to remove a passkey', async () => {
    const result = service.remove('passkey-1');
    httpMock
      .expectOne((req) => req.method === 'DELETE')
      .flush(
        { message: 'For your security, please sign in again to remove a passkey.', data: { reauthRequired: true } },
        { status: 403, statusText: 'Forbidden' }
      );

    expect(await result).toEqual({
      status: 'reauth-required',
      message: 'For your security, please sign in again to remove a passkey.',
    });
  });

  it('reports whether the browser supports passkeys', () => {
    browser.browserSupportsWebAuthn.mockReturnValue(false);

    expect(service.isSupported()).toBe(false);
  });
});

describe('describeThisDevice', () => {
  it.each([
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36', 'Chrome on Windows'],
    ['Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 Edg/131.0', 'Edge on Windows'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15', 'Safari on macOS'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari/604.1', 'Safari on iOS'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36', 'Chrome on Android'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', 'Firefox on Linux'],
  ])('names %s as "%s"', (userAgent, expected) => {
    expect(describeThisDevice(userAgent)).toBe(expected);
  });
});
