import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { AuthState } from './auth.state';
import { AuthSelectors } from './auth.selectors';
import { RestoreSession } from './auth.actions';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { ToastService } from '../../../shared/services/toast.service';

const STALE_USER = {
  id: 'user-1',
  email: 'mentor@example.com',
  fullName: 'Mentor One',
  role: 'mentor',
  isProfileComplete: true,
  isMentorProfileComplete: false, // days-old snapshot: setup was finished elsewhere
};

const LIVE_TOKEN = (() => {
  const encode = (v: unknown) =>
    btoa(JSON.stringify(v)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'ES256' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
})();

describe('AuthState / RestoreSession', () => {
  let store: Store;
  let httpMock: HttpTestingController;
  let storage: Record<string, ReturnType<typeof vi.fn>>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = {
      getToken: vi.fn().mockReturnValue(LIVE_TOKEN),
      getRefreshToken: vi.fn().mockReturnValue('refresh-abc'),
      getUser: vi.fn().mockReturnValue(STALE_USER),
      setUser: vi.fn(),
      setToken: vi.fn(),
      setRefreshToken: vi.fn(),
      clear: vi.fn(),
      setLastRegisteredEmail: vi.fn(),
    };
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore([AuthState]),
        { provide: AuthStorageService, useValue: storage },
        { provide: Router, useValue: { navigate } },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });

    store = TestBed.inject(Store);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('replaces the cached user with what the server says', async () => {
    const done = firstValueFrom(store.dispatch(new RestoreSession()));

    const request = httpMock.expectOne((req) => req.url.includes('/auth/session'));
    request.flush({
      statusCode: 200,
      data: { ...STALE_USER, isMentorProfileComplete: true },
    });

    await done;

    expect(store.selectSnapshot(AuthSelectors.user)?.isMentorProfileComplete).toBe(true);
    expect(storage.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ isMentorProfileComplete: true })
    );
    expect(store.selectSnapshot(AuthSelectors.isRestoringSession)).toBe(false);
  });

  it('clears the session and sends the user to login when the server rejects the token', async () => {
    const done = firstValueFrom(store.dispatch(new RestoreSession()));

    httpMock
      .expectOne((req) => req.url.includes('/auth/session'))
      .flush({ statusCode: 401, message: 'Your session has expired. Please log in again.' },
             { status: 401, statusText: 'Unauthorized' });

    await done;

    expect(storage.clear).toHaveBeenCalled();
    expect(store.selectSnapshot(AuthSelectors.user)).toBeNull();
    expect(store.selectSnapshot(AuthSelectors.isRestoringSession)).toBe(false);
  });

  it('does not call the API when nothing is stored', async () => {
    storage.getToken.mockReturnValue(null);
    storage.getUser.mockReturnValue(null);

    await firstValueFrom(store.dispatch(new RestoreSession()));

    httpMock.expectNone((req) => req.url.includes('/auth/session'));
    expect(store.selectSnapshot(AuthSelectors.isRestoringSession)).toBe(false);
  });
});
