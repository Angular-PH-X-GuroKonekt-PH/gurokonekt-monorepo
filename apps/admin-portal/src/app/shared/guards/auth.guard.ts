import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthSelectors } from '../../core/auth/store/auth.selectors';
import { APP_ROUTES } from '../constants/routes';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const store = inject(Store);
  const router = inject(Router);

  const isAuthenticated = store.selectSnapshot(AuthSelectors.isAuthenticated);
  const user = store.selectSnapshot(AuthSelectors.user);

  if (!isAuthenticated || !user) {
    return router.createUrlTree([APP_ROUTES.LOGIN]);
  }

  if (user.role !== 'admin') {
    return router.createUrlTree([APP_ROUTES.LOGIN]);
  }

  return true;
};
