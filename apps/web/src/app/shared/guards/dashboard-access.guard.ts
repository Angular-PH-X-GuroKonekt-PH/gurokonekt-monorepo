import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { requiresProfileSetup } from '../utils/profile-completion.util';
import { consumePostLoginRedirect } from '../utils/post-login-redirect.util';
import { APP_ROUTES } from '../constants/routes';
import { AuthSelectors } from '../../core/auth/store/auth.selectors';

export const dashboardAccessGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);

  const user = store.selectSnapshot(AuthSelectors.user);

  if (!user) {
    return router.createUrlTree([APP_ROUTES.LOGIN]);
  }

  if (user.status === 'inactive') {
    return router.createUrlTree([`/${APP_ROUTES.ACTIVATE_ACCOUNT}`]);
  }

  if (requiresProfileSetup(user.role, user.isProfileComplete, user.isMentorProfileComplete)) {
    return router.createUrlTree([APP_ROUTES.PROFILE_SETUP]);
  }

  // Sign-in finished, so return to the page that asked for it (e.g. Passkeys).
  const redirect = consumePostLoginRedirect();
  if (redirect) {
    return router.parseUrl(redirect);
  }

  return true;
};
