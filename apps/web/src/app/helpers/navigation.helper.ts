import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '@gurokonekt/models';
import { APP_ROUTES } from '../constants/routes';
import { normalizeRole, requiresProfileSetup } from './profile-completion.helper';

/**
 * Navigation helper for common routing operations
 */
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
   * Navigate to forgot password
   */
  async navigateToForgotPassword(): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.FORGOT_PASSWORD]);
  }

  /**
   * Navigate to dashboard based on user role and profile completion status
   */
  async navigateToDashboard(role: string, isProfileComplete?: boolean): Promise<boolean> {
    if (requiresProfileSetup(role, isProfileComplete)) {
      return this.router.navigate([APP_ROUTES.PROFILE_SETUP]);
    }
    
    if (normalizeRole(role) === 'mentor') {
      return this.router.navigate([APP_ROUTES.MENTOR_DASHBOARD]);
    } else {
      return this.router.navigate([APP_ROUTES.MENTEE_DASHBOARD]);
    }
  }

  /**
   * Navigate to email verification page
   */
  async navigateToVerifyEmail(params: { email: string; role: string; message: string }): Promise<boolean> {
    return this.router.navigate([APP_ROUTES.VERIFY_EMAIL], {
      queryParams: { 
        email: params.email,
        role: params.role,
        message: params.message
      },
    });
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