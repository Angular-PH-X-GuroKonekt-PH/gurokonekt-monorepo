import { Router } from '@angular/router';
import { Role } from '@gurokonekt/models';

/**
 * Navigation helper for common routing operations
 */
export class NavigationHelper {
  
  constructor(private router: Router) {}

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<boolean> {
    return this.router.navigate(['/login']);
  }

  /**
   * Navigate to role selection
   */
  async navigateToRoleSelection(): Promise<boolean> {
    return this.router.navigate(['/choose-role']);
  }

  /**
   * Navigate to register based on role
   */
  async navigateToRegister(role: Role = 'mentee'): Promise<boolean> {
    if (role === 'mentor') {
      return this.router.navigate(['/mentor/register']);
    } else {
      return this.router.navigate(['/register']);
    }
  }

  /**
   * Navigate to forgot password
   */
  async navigateToForgotPassword(): Promise<boolean> {
    return this.router.navigate(['/forgot-password']);
  }

  /**
   * Navigate to dashboard based on user role
   */
  async navigateToDashboard(role: string): Promise<boolean> {
    if (role === 'mentor') {
      return this.router.navigate(['/mentor/dashboard']);
    } else {
      return this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Navigate to email verification page
   */
  async navigateToVerifyEmail(params: { email: string; role: string; message: string }): Promise<boolean> {
    return this.router.navigate(['/verify-email'], {
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