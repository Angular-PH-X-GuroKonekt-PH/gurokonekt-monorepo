import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';
import { vi } from 'vitest';

import { SecuritySetupService } from '../../core/security-setup/security-setup.service';
import { securitySetupGuard } from './security-setup.guard';

describe('securitySetupGuard', () => {
  const setup = { current: vi.fn(), refresh: vi.fn() };
  let user: unknown;

  beforeEach(() => {
    setup.current.mockReset();
    setup.refresh.mockReset();
    user = { id: 'u1' };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Store, useValue: { selectSnapshot: () => user } },
        { provide: SecuritySetupService, useValue: setup },
      ],
    });
  });

  const run = () =>
    TestBed.runInInjectionContext(() =>
      securitySetupGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as Promise<boolean | UrlTree>;

  it('sends accounts with missing methods to the setup page', async () => {
    setup.current.mockReturnValue(null);
    setup.refresh.mockResolvedValue({ requirementsCompleted: false });

    const result = await run();

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/security-setup');
  });

  it('uses the cached answer when there is one', async () => {
    setup.current.mockReturnValue({ requirementsCompleted: true });

    expect(await run()).toBe(true);
    expect(setup.refresh).not.toHaveBeenCalled();
  });

  it('lets the page load if the check fails, since the API still enforces it', async () => {
    setup.current.mockReturnValue(null);
    setup.refresh.mockRejectedValue(new Error('offline'));

    expect(await run()).toBe(true);
  });

  it('leaves signed-out users to the route’s own guard', async () => {
    user = null;

    expect(await run()).toBe(true);
    expect(setup.refresh).not.toHaveBeenCalled();
  });
});
