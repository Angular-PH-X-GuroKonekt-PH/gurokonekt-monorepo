import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { APP_ROUTES } from '../../../shared/constants/routes';
import { requiresProfileSetup } from '../../../shared/utils/profile-completion.util';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthSelectors } from '../store/auth.selectors';
import { RegistrationSelectors } from '../store/registration.selectors';
import * as RegistrationActions from '../store/registration.actions';

/**
 * Where a signed-in user goes next: reactivation for inactive accounts,
 * profile setup until the profile is complete, otherwise the dashboard.
 */
export async function navigateAfterLogin(store: Store, router: Router): Promise<void> {
  const user = store.selectSnapshot(AuthSelectors.user);
  if (!user) {
    return;
  }

  if (user.status === 'inactive') {
    await router.navigate([`/${APP_ROUTES.ACTIVATE_ACCOUNT}`]);
    return;
  }

  if (requiresProfileSetup(user.role, user.isProfileComplete, user.isMentorProfileComplete)) {
    await router.navigate([APP_ROUTES.PROFILE_SETUP]);
    return;
  }

  await router.navigate([APP_ROUTES.DASHBOARD]);
}

/**
 * After "Continue with Google": an existing account is signed in and moves on
 * as after any login. A new Google account has no GuroKonekt account yet, so
 * the person goes through registration (role, required details, terms) like
 * everyone else, with their Google name and email already filled in.
 */
export async function continueAfterGoogle(store: Store, router: Router, toastService: ToastService): Promise<void> {
  if (store.selectSnapshot(RegistrationSelectors.googleRegistration)) {
    store.dispatch(new RegistrationActions.BackToRoleSelection());
    toastService.info(
      'Choose your role and fill in a few details to finish creating your account.',
      'Almost there!'
    );
    await router.navigate([APP_ROUTES.REGISTER]);
    return;
  }

  await navigateAfterLogin(store, router);
}
