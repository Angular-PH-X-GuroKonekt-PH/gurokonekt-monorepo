import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthState } from './auth.state';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../../profile/profile.service';
import { NavigationHelper } from '../../../shared/helpers';
import * as AuthActions from './auth.actions';
import { AuthUser } from '@gurokonekt/models';

const mockUser: AuthUser = {
  id: 'u1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'mentee',
  isProfileComplete: false,
  isMentorProfileComplete: false,
};

const mockLoginResponse = {
  user: mockUser,
  accessToken: 'tok123',
  token: 'tok123',
  message: 'Login successful',
};

function configureBed(authServiceOverrides: Partial<{ login: unknown }> = {}) {
  const authService = {
    login: vi.fn().mockReturnValue(of(mockLoginResponse)),
    registerMentee: vi.fn().mockReturnValue(of({ message: 'Registered!', email: mockUser.email })),
    registerMentor: vi.fn().mockReturnValue(of({ message: 'Registered!', email: mockUser.email })),
    ...authServiceOverrides,
  };

  const storage = {
    getToken: vi.fn().mockReturnValue(null),
    getUser: vi.fn().mockReturnValue(null),
    setToken: vi.fn(),
    setUser: vi.fn(),
    clear: vi.fn(),
  };

  const navHelper = { navigateToLogin: vi.fn().mockResolvedValue(true) };

  TestBed.configureTestingModule({
    imports: [NgxsModule.forRoot([AuthState])],
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: ProfileService, useValue: {} },
      { provide: AuthStorageService, useValue: storage },
      { provide: NavigationHelper, useValue: navHelper },
    ],
  });

  return {
    store: TestBed.inject(Store),
    authService,
    storage,
    navHelper,
  };
}

describe('AuthState — Login → LoginSuccess', () => {
  let deps: ReturnType<typeof configureBed>;

  beforeEach(() => { deps = configureBed(); });
  afterEach(() => localStorage.clear());

  it('stores user and token in state on success', async () => {
    await deps.store.dispatch(new AuthActions.Login({ email: mockUser.email, password: 'pw' })).toPromise();

    const auth = deps.store.snapshot().auth;
    expect(auth.user).toEqual(mockUser);
    expect(auth.token).toBe('tok123');
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isLoginLoading).toBe(false);
  });

  it('persists token and user via AuthStorageService', async () => {
    await deps.store.dispatch(new AuthActions.Login({ email: mockUser.email, password: 'pw' })).toPromise();
    expect(deps.storage.setToken).toHaveBeenCalledWith('tok123');
    expect(deps.storage.setUser).toHaveBeenCalledWith(mockUser);
  });
});

describe('AuthState — Login failure', () => {
  let deps: ReturnType<typeof configureBed>;

  beforeEach(() => {
    deps = configureBed({
      login: vi.fn().mockReturnValue(throwError(() => ({ status: 401 }))),
    });
  });
  afterEach(() => localStorage.clear());

  it('sets errorMessage on login failure', async () => {
    try {
      await deps.store.dispatch(new AuthActions.Login({ email: 'bad@example.com', password: 'wrong' })).toPromise();
    } catch {
      // error re-thrown by the state
    }

    const auth = deps.store.snapshot().auth;
    expect(auth.errorMessage).toBeTruthy();
    expect(auth.isAuthenticated).toBe(false);
  });
});

describe('AuthState — RestoreSession', () => {
  let deps: ReturnType<typeof configureBed>;

  beforeEach(() => { deps = configureBed(); });
  afterEach(() => localStorage.clear());

  it('restores user and token from storage when both are valid', () => {
    deps.storage.getToken.mockReturnValue('saved-tok');
    deps.storage.getUser.mockReturnValue(mockUser);

    deps.store.dispatch(new AuthActions.RestoreSession());

    const auth = deps.store.snapshot().auth;
    expect(auth.user).toEqual(mockUser);
    expect(auth.isAuthenticated).toBe(true);
  });

  it('leaves state blank when token is missing', () => {
    deps.storage.getToken.mockReturnValue(null);
    deps.storage.getUser.mockReturnValue(mockUser);

    deps.store.dispatch(new AuthActions.RestoreSession());

    expect(deps.store.snapshot().auth.isAuthenticated).toBe(false);
  });

  it('clears storage and resets state when stored user lacks required fields', () => {
    deps.storage.getToken.mockReturnValue('tok');
    deps.storage.getUser.mockReturnValue({ id: '', email: '', role: '' } as AuthUser);

    deps.store.dispatch(new AuthActions.RestoreSession());

    expect(deps.storage.clear).toHaveBeenCalled();
    expect(deps.store.snapshot().auth.isAuthenticated).toBe(false);
  });
});

describe('AuthState — Logout', () => {
  let deps: ReturnType<typeof configureBed>;

  beforeEach(() => { deps = configureBed(); });
  afterEach(() => localStorage.clear());

  it('clears storage and resets state', async () => {
    await deps.store.dispatch(new AuthActions.Login({ email: mockUser.email, password: 'pw' })).toPromise();
    deps.store.dispatch(new AuthActions.Logout());

    expect(deps.storage.clear).toHaveBeenCalled();
    const auth = deps.store.snapshot().auth;
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
  });

  it('navigates to login after logout', () => {
    deps.store.dispatch(new AuthActions.Logout());
    expect(deps.navHelper.navigateToLogin).toHaveBeenCalled();
  });
});
