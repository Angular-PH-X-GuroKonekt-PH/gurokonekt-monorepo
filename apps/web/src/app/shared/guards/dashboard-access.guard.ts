import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { normalizeRole, requiresProfileSetup } from '../helpers/profile-completion.helper';
import { AuthState } from '../../core/auth/store/auth.state';
import { APP_ROUTES } from '../constants/routes';

export const dashboardAccessGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);

  const user = store.selectSnapshot(AuthState.user);

  if (!user) {
    return router.createUrlTree([APP_ROUTES.LOGIN]);
  }

  const isProfileComplete = user['isProfileComplete'] === true;
  const isMentorProfileComplete = user['isMentorProfileComplete'] === true;

  if (requiresProfileSetup(user.role, isProfileComplete, isMentorProfileComplete)) {
    if (normalizeRole(user.role) === 'mentor') {
      return router.createUrlTree([APP_ROUTES.MENTOR_PROFILE_SETUP]);
    }

    return router.createUrlTree([APP_ROUTES.PROFILE_SETUP]);
  }

  return true;
};