import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { APP_ROUTES } from '../constants/routes';
import { requiresProfileSetup } from '../helpers/profile-completion.helper';
import { AuthState } from '../store/auth/auth.state';

export const dashboardAccessGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);

  const user = store.selectSnapshot(AuthState.user);

  if (!user) {
    return router.createUrlTree([APP_ROUTES.LOGIN]);
  }

  const isProfileComplete = user['isProfileComplete'] === true;

  if (requiresProfileSetup(user.role, isProfileComplete)) {
    return router.createUrlTree([APP_ROUTES.PROFILE_SETUP]);
  }

  return true;
};