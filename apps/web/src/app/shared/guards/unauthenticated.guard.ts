import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { AuthState } from '../../core/auth/store/auth.state';
import { requiresProfileSetup } from '../utils/profile-completion.util';
import { APP_ROUTES } from '../constants/routes';
import { AuthSelectors } from '../../core/auth/store/auth.selectors';

export const unauthenticatedGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);

  const user = store.selectSnapshot(AuthSelectors.user);

  if (!user) {
    return true;
  }

  if (requiresProfileSetup(user.role, user.isProfileComplete, user.isMentorProfileComplete)) {
    return router.createUrlTree([APP_ROUTES.PROFILE_SETUP]);
  }

  return router.createUrlTree([APP_ROUTES.DASHBOARD]);
};
