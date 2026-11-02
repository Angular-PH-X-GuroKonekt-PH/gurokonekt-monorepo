import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SignInMethodsService } from './sign-in-methods.service';
import { AuthStorageService } from '../../storage/auth-storage.service';

const METHODS = { password: true, google: { connected: true, email: 'jane@gmail.com' }, passkeys: 1 };

describe('SignInMethodsService', () => {
  let service: SignInMethodsService;
  let httpMock: HttpTestingController;
  let storage: { getRefreshToken: ReturnType<typeof vi.fn>; setToken: ReturnType<typeof vi.fn>; setRefreshToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    storage = {
      getRefreshToken: vi.fn().mockReturnValue('stored-refresh'),
      setToken: vi.fn(),
      setRefreshToken: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthStorageService, useValue: storage }],
    });
    service = TestBed.inject(SignInMethodsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists the sign-in methods', async () => {
    const result = service.list();
    httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/auth/sign-in-methods')).flush({ data: METHODS });

    expect(await result).toEqual(METHODS);
  });

  it('connects Google with the stored refresh token and saves the fresh tokens', async () => {
    const result = service.connectGoogle({ idToken: 'google-id-token', nonce: 'raw-nonce' });

    const request = httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/auth/sign-in-methods/google'));
    expect(request.request.body).toEqual({ idToken: 'google-id-token', nonce: 'raw-nonce', refreshToken: 'stored-refresh' });
    request.flush({
      message: 'Google is now connected. You can use it to sign in.',
      data: { methods: METHODS, session: { accessToken: 'new-access', refreshToken: 'new-refresh' } },
    });

    expect(await result).toEqual({
      status: 'done',
      methods: METHODS,
      message: 'Google is now connected. You can use it to sign in.',
    });
    expect(storage.setToken).toHaveBeenCalledWith('new-access');
    expect(storage.setRefreshToken).toHaveBeenCalledWith('new-refresh');
  });

  it('disconnects Google', async () => {
    const result = service.disconnectGoogle();

    const request = httpMock.expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/auth/sign-in-methods/google'));
    expect(request.request.body).toEqual({ refreshToken: 'stored-refresh' });
    request.flush({ message: 'Google has been disconnected from your account.', data: { methods: METHODS, session: null } });

    expect((await result).status).toBe('done');
    expect(storage.setToken).not.toHaveBeenCalled();
  });

  it('asks to sign in again when the sign-in is too old', async () => {
    const message = 'For your security, please sign in again to change how you sign in.';
    const result = service.disconnectGoogle();
    httpMock
      .expectOne((req) => req.method === 'DELETE')
      .flush({ message, data: { reauthRequired: true } }, { status: 403, statusText: 'Forbidden' });

    expect(await result).toEqual({ status: 'reauth-required', message });
  });

  it("shows the server's reason when connecting fails", async () => {
    const message = 'This Google account is already connected to another GuroKonekt account.';
    const result = service.connectGoogle({ idToken: 'google-id-token', nonce: 'raw-nonce' });
    httpMock.expectOne((req) => req.method === 'POST').flush({ message }, { status: 409, statusText: 'Conflict' });

    expect(await result).toEqual({ status: 'failed', message });
  });
});
