import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '@gurokonekt/models';
import { APP_ROUTES } from '../constants/routes';
import { normalizeRole, requiresProfileSetup } from './profile-completion.helper';

@Injectable({ providedIn: 'root' })
export class NavigationHelper {
  
  private router = inject(Router);

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.LOGIN]);
  }

  /**
   * Navigate to role selection
   */
  async navigateToRoleSelection(): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.REGISTER]);
  }

  /**
   * Navigate to register based on role
   */
  async navigateToRegister(role: Role = 'mentee'): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.REGISTER], {
      queryParams: { step: role }
    });
  }

  /**
   * Navigate to dashboard based on user role and profile completion status
   */
  async navigateToDashboard(
    role: string,
    isProfileComplete?: boolean,
    isMentorProfileComplete?: boolean
  ): Promise<boolean> {
    if (requiresProfileSetup(role, isProfileComplete, isMentorProfileComplete)) {
      if (normalizeRole(role) === 'mentor') {
        return this.router.navigate([APP_ROUTES.MENTOR_PROFILE_SETUP]);
      }

      return this.router.navigate([APP_ROUTES.PROFILE_SETUP]);
    }

    if (normalizeRole(role) === 'mentor') {
      return this.router.navigate([APP_ROUTES.MENTOR_DASHBOARD]);
    }

    return this.router.navigate([APP_ROUTES.PROFILE_SETUP]);
  }

  /**
   * Navigate back in browser history
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Navigate to external URL
   */
  navigateToExternal(url: string): void {
    window.open(url, '_blank');
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  /**
   * Scroll to element by ID
   */
  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
