import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { AuthState } from '../../core/auth/store/auth.state';
import { normalizeRole, requiresProfileSetup } from '../helpers/profile-completion.helper';
import { APP_ROUTES } from '../constants/routes';

export const unauthenticatedGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);

  const user = store.selectSnapshot(AuthState.user);

  if (!user) {
    return true;
  }

  const isProfileComplete = user['isProfileComplete'] === true;
  const isMentorProfileComplete = user['isMentorProfileComplete'] === true;

  if (requiresProfileSetup(user.role, isProfileComplete, isMentorProfileComplete)) {
    return router.createUrlTree([
      normalizeRole(user.role) === 'mentor'
        ? APP_ROUTES.MENTOR_PROFILE_SETUP
        : APP_ROUTES.PROFILE_SETUP,
    ]);
  }

  return router.createUrlTree([
    normalizeRole(user.role) === 'mentor'
      ? APP_ROUTES.MENTOR_DASHBOARD
      : APP_ROUTES.MENTEE_DASHBOARD,
  ]);
};
