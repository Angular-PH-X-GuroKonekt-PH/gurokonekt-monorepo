import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { AuthSelectors } from '../../core/auth/store/auth.selectors';
import { APP_ROUTES } from '../constants/routes';

export const mentorRegistrationConfirmationGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);

  const lastRegisteredEmail = store.selectSnapshot(AuthSelectors.lastRegisteredEmail);

  if (lastRegisteredEmail) {
    return true;
  }

  return router.createUrlTree([APP_ROUTES.REGISTER], {
    queryParams: { step: 'mentor' },
  });
};
