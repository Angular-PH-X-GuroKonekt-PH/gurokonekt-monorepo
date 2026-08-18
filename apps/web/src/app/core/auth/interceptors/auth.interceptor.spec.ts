import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { AuthStorageService } from '../../storage/auth-storage.service';
import { SessionExpired } from '../store/auth.actions';
import { authInterceptor } from './auth.interceptor';

function makeToken(expEpochSeconds: number): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'ES256', typ: 'JWT' })}.${encode({ exp: expEpochSeconds })}.sig`;
}

const EXPIRED = makeToken(Math.floor(Date.now() / 1000) - 86_400);
const LIVE = makeToken(Math.floor(Date.now() / 1000) + 3600);

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storage: { getToken: ReturnType<typeof vi.fn>; getRefreshToken: ReturnType<typeof vi.fn>; setToken: ReturnType<typeof vi.fn>; setRefreshToken: ReturnType<typeof vi.fn> };
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = {
      getToken: vi.fn(),
      getRefreshToken: vi.fn(),
      setToken: vi.fn(),
      setRefreshToken: vi.fn(),
    };
    dispatch = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStorageService, useValue: storage },
        { provide: Store, useValue: { dispatch } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('refreshes before sending when the stored token is already expired', async () => {
    storage.getToken.mockReturnValue(EXPIRED);
    storage.getRefreshToken.mockReturnValue('refresh-abc');

    const pending = firstValueFrom(http.patch('/api/user/1/profile', new FormData()));

    // The refresh must go out first — the profile request has not been sent yet.
    const refresh = httpMock.expectOne((req) => req.url.includes('/auth/refresh-token'));
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-abc' });
    refresh.flush({ data: { accessToken: LIVE, refreshToken: 'refresh-def' } });

    const profile = httpMock.expectOne('/api/user/1/profile');
    expect(profile.request.headers.get('Authorization')).toBe(`Bearer ${LIVE}`);
    profile.flush({ statusCode: 200 });

    await pending;
    expect(storage.setToken).toHaveBeenCalledWith(LIVE);
    expect(storage.setRefreshToken).toHaveBeenCalledWith('refresh-def');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches SessionExpired when the token is expired and no refresh token remains', async () => {
    storage.getToken.mockReturnValue(EXPIRED);
    storage.getRefreshToken.mockReturnValue(null);

    const failure = firstValueFrom(http.patch('/api/user/1/profile', new FormData())).catch((e) => e);

    const error = await failure;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Your session has expired. Please log in again.');
    expect(dispatch).toHaveBeenCalledWith(expect.any(SessionExpired));
  });

  it('sends a live token straight through without refreshing', async () => {
    storage.getToken.mockReturnValue(LIVE);
    storage.getRefreshToken.mockReturnValue('refresh-abc');

    const pending = firstValueFrom(http.get('/api/user/1/dashboard'));

    const request = httpMock.expectOne('/api/user/1/dashboard');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${LIVE}`);
    request.flush({ statusCode: 200 });

    await pending;
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('never pre-refreshes on a public auth route', async () => {
    storage.getToken.mockReturnValue(EXPIRED);
    storage.getRefreshToken.mockReturnValue('refresh-abc');

    const pending = firstValueFrom(http.post('/api/auth/login', { email: 'a@b.c', password: 'x' }));

    const request = httpMock.expectOne('/api/auth/login');
    request.flush({ statusCode: 200, data: {} });

    await pending;
    expect(dispatch).not.toHaveBeenCalled();
  });
});
