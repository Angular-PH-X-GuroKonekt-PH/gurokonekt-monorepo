import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { APP_ROUTES } from '../constants/routes';
import { AuthSelectors } from '../../core/auth/store/auth.selectors';
import { SecuritySetupService } from '../../core/security-setup/security-setup.service';

/**
 * Sends signed-in users who are missing a required sign-in method to the
 * setup page (#463). Signed-out users pass through to the route's own guard.
 * If the check itself fails the page loads anyway: the API still refuses
 * every request until setup is done.
 */
export const securitySetupGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const store = inject(Store);
  const router = inject(Router);
  const setup = inject(SecuritySetupService);

  if (!store.selectSnapshot(AuthSelectors.user)) return true;

  const status = setup.current() ?? (await setup.refresh().catch(() => null));
  return status && !status.requirementsCompleted ? router.createUrlTree([`/${APP_ROUTES.SECURITY_SETUP}`]) : true;
};

/** The setup page itself only needs a signed-in user. */
export const securitySetupPageGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);
  return store.selectSnapshot(AuthSelectors.user) ? true : router.createUrlTree([APP_ROUTES.LOGIN]);
};
