import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '@gurokonekt/models';
import { APP_ROUTES } from '../constants/routes';
import { requiresProfileSetup } from './profile-completion.helper';

@Injectable({ providedIn: 'root' })
export class NavigationHelper {

  private router = inject(Router);

  async navigateToLogin(): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.LOGIN]);
  }

  async navigateToRoleSelection(): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.REGISTER]);
  }

  async navigateToRegister(role: Role = 'mentee'): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.REGISTER], {
      queryParams: { step: role }
    });
  }

  async navigateToDashboard(
    role: string,
    isProfileComplete?: boolean,
    isMentorProfileComplete?: boolean
  ): Promise<boolean> {
    if (requiresProfileSetup(role, isProfileComplete, isMentorProfileComplete)) {
      return this.router.navigate([APP_ROUTES.PROFILE_SETUP]);
    }

    return this.router.navigate([APP_ROUTES.DASHBOARD]);
  }

  goBack(): void {
    window.history.back();
  }

  navigateToExternal(url: string): void {
    window.open(url, '_blank');
  }

  scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
