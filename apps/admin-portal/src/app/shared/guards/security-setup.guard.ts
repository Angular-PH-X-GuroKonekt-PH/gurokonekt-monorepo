import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SecuritySetupService } from '../../core/security-setup/security-setup.service';
import { APP_ROUTES } from '../constants/routes';

/**
 * Sends admins who are missing a required sign-in method to the setup page.
 * If the check itself fails the page loads anyway: the API still refuses
 * every admin request until setup is done.
 */
export const securitySetupGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const setup = inject(SecuritySetupService);
  const router = inject(Router);

  const status = setup.status() ?? (await setup.refresh().catch(() => null));
  return status && !status.requirementsCompleted ? router.createUrlTree([APP_ROUTES.SECURITY_SETUP]) : true;
};
