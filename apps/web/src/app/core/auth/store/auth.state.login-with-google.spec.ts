import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { AuthState } from './auth.state';
import { AuthSelectors } from './auth.selectors';
import { LoginWithGoogle } from './auth.actions';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { ToastService } from '../../../shared/services/toast.service';

const API_USER = {
  id: 'user-1',
  email: 'mentee@example.com',
  firstName: 'Jane',
  lastName: 'Dela Cruz',
  role: 'mentee',
  status: 'active',
  isProfileComplete: true,
  isMentorProfileComplete: false,
};

describe('AuthState / LoginWithGoogle', () => {
  let store: Store;
  let httpMock: HttpTestingController;
  let storage: Record<string, ReturnType<typeof vi.fn>>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    storage = {
      getToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue(null),
      getUser: vi.fn().mockReturnValue(null),
      setUser: vi.fn(),
      setToken: vi.fn(),
      setRefreshToken: vi.fn(),
      clear: vi.fn(),
      setLastRegisteredEmail: vi.fn(),
    };
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore([AuthState]),
        { provide: AuthStorageService, useValue: storage },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });

    store = TestBed.inject(Store);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    consoleError.mockRestore();
  });

  it('sends the Google token and nonce, then stores the session like a password login', async () => {
    const done = firstValueFrom(
      store.dispatch(new LoginWithGoogle({ idToken: 'google-id-token', nonce: 'raw-nonce' }))
    );

    const request = httpMock.expectOne((req) => req.url.endsWith('/auth/signin/google'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ idToken: 'google-id-token', nonce: 'raw-nonce' });
    request.flush({
      statusCode: 200,
      message: 'Signed in with Google successfully',
      data: {
        user: API_USER,
        session: { access_token: 'access-token', refresh_token: 'refresh-token' },
        redirectUrl: null,
      },
    });

    await done;

    expect(store.selectSnapshot(AuthSelectors.user)).toEqual(
      expect.objectContaining({ id: 'user-1', role: 'mentee', fullName: 'Jane Dela Cruz' })
    );
    expect(storage.setToken).toHaveBeenCalledWith('access-token');
    expect(storage.setRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(store.selectSnapshot(AuthSelectors.isLoginLoading)).toBe(false);
  });

  it.each([
    [401, 'Google sign-in failed. Please try again.'],
    [404, 'No GuroKonekt account found for this Google account. Please register first.'],
    [403, 'Google sign-in is not available for this account. Please sign in with your email and password.'],
  ])('shows the API message for a %s instead of a password or session error', async (status, message) => {
    const done = firstValueFrom(store.dispatch(new LoginWithGoogle({ idToken: 'google-id-token' })));

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/signin/google'))
      .flush({ status: 'error', statusCode: status, message, data: null }, { status, statusText: 'Error' });

    await expect(done).rejects.toBeDefined();

    expect(store.selectSnapshot(AuthSelectors.errorMessage)).toBe(message);
    expect(store.selectSnapshot(AuthSelectors.user)).toBeNull();
    expect(store.selectSnapshot(AuthSelectors.isLoginLoading)).toBe(false);
    expect(storage.setToken).not.toHaveBeenCalled();
  });

  it('never writes the Google token to the console', async () => {
    const done = firstValueFrom(store.dispatch(new LoginWithGoogle({ idToken: 'google-id-token' })));

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/signin/google'))
      .flush({ message: 'Google sign-in failed. Please try again.' }, { status: 401, statusText: 'Unauthorized' });

    await expect(done).rejects.toBeDefined();

    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('google-id-token');
  });

  it('explains a network failure instead of showing a generic error', async () => {
    const done = firstValueFrom(store.dispatch(new LoginWithGoogle({ idToken: 'google-id-token' })));

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/signin/google'))
      .error(new ProgressEvent('error'), { status: 0 });

    await expect(done).rejects.toBeDefined();

    expect(store.selectSnapshot(AuthSelectors.errorMessage)).toBe(
      'Unable to reach the server. Please check your connection and try again.'
    );
  });
});
