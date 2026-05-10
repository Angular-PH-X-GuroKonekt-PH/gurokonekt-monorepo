import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';
import { vi } from 'vitest';
import { dashboardAccessGuard } from './dashboard-access.guard';
import { AuthState } from '../../core/auth/store/auth.state';
import { APP_ROUTES } from '../constants/routes';
import { AuthUser } from '@gurokonekt/models';

function runGuard(): boolean | UrlTree {
  return TestBed.runInInjectionContext(() => dashboardAccessGuard({} as never, {} as never));
}

function mockSnapshot(user: AuthUser | null) {
  const store = TestBed.inject(Store);
  vi.spyOn(store, 'selectSnapshot').mockImplementation((selector) => {
    if (selector === AuthState.user) return user;
    return null;
  });
}

describe('dashboardAccessGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: { selectSnapshot: vi.fn() } },
        { provide: Router, useValue: { createUrlTree: (path: string[]) => path, navigate: vi.fn() } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('redirects to login when no user is in state', () => {
    mockSnapshot(null);
    const result = runGuard();
    expect(result).toEqual([APP_ROUTES.LOGIN]);
  });

  it('returns true when mentee profile is complete', () => {
    mockSnapshot({ id: '1', email: 'a@b.com', fullName: 'A', role: 'mentee', isProfileComplete: true, isMentorProfileComplete: false });
    expect(runGuard()).toBe(true);
  });

  it('redirects mentee with incomplete profile to PROFILE_SETUP', () => {
    mockSnapshot({ id: '1', email: 'a@b.com', fullName: 'A', role: 'mentee', isProfileComplete: false, isMentorProfileComplete: false });
    expect(runGuard()).toEqual([APP_ROUTES.PROFILE_SETUP]);
  });

  it('redirects mentor with incomplete profile to PROFILE_SETUP', () => {
    mockSnapshot({ id: '2', email: 'b@c.com', fullName: 'B', role: 'mentor', isProfileComplete: false, isMentorProfileComplete: false });
    expect(runGuard()).toEqual([APP_ROUTES.PROFILE_SETUP]);
  });

  it('returns true when mentor profile is complete', () => {
    mockSnapshot({ id: '2', email: 'b@c.com', fullName: 'B', role: 'mentor', isProfileComplete: false, isMentorProfileComplete: true });
    expect(runGuard()).toBe(true);
  });
});
