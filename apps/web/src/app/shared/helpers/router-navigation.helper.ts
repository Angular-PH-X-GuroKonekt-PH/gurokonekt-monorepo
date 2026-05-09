import { Router } from '@angular/router';

/**
 * Centralized navigation helper for consistent routing patterns
 */
export class RouterNavigationHelper {
  /**
   * Navigate with error handling
   */
  static async navigateTo(router: Router, route: string | string[], extras?: any): Promise<boolean> {
    try {
      const routeArray = Array.isArray(route) ? route : [route];
      return await router.navigate(routeArray, extras);
    } catch (error) {
      console.error('Navigation failed:', error);
      return false;
    }
  }

  /**
   * Navigate to authentication routes
   */
  static async navigateToAuth(router: Router, authType: 'login' | 'register' | 'forgot-password' | 'choose-role'): Promise<boolean> {
    const routes = {
      'login': ['/login'],
      'register': ['/register'],
      'forgot-password': ['/forgot-password'],
      'choose-role': ['/register']
    };

    return RouterNavigationHelper.navigateTo(router, routes[authType]);
  }

  /**
   * Navigate to dashboard with user context
   */
  static async navigateToDashboard(router: Router, userRole?: 'mentee' | 'mentor'): Promise<boolean> {
    const route = userRole ? `/dashboard/${userRole}` : '/dashboard';
    return RouterNavigationHelper.navigateTo(router, route);
  }

  /**
   * Navigate to email verification with context
   */
  static async navigateToVerification(
    router: Router, 
    email: string, 
    role: 'mentee' | 'mentor',
    message?: string
  ): Promise<boolean> {
    return RouterNavigationHelper.navigateTo(router, ['/verify-email'], {
      queryParams: { 
        email, 
        role,
        message: message || 'Thank you for joining GuroKonekt! We have sent you an email to verify your account.' 
      }
    });
  }

  /**
   * Navigate back with fallback
   */
  static async navigateBack(router: Router, fallbackRoute = '/'): Promise<boolean> {
    if (window.history.length > 1) {
      window.history.back();
      return true;
    } else {
      return RouterNavigationHelper.navigateTo(router, fallbackRoute);
    }
  }

  /**
   * Get current route information
   */
  static getCurrentRoute(router: Router): {
    url: string;
    isAuthRoute: boolean;
    isDashboardRoute: boolean;
  } {
    const url = router.url;
    const isAuthRoute = ['/login', '/register', '/forgot-password', '/verify-email'].some(route => 
      url.startsWith(route)
    );
    const isDashboardRoute = url.startsWith('/dashboard');

    return { url, isAuthRoute, isDashboardRoute };
  }

  /**
   * Navigate to login page
   */
  static navigateToLogin(router: Router): Promise<boolean> {
    return RouterNavigationHelper.navigateTo(router, ['/login']);
  }

  /**
   * Navigate to registration page  
   */
  static navigateToRegistration(router: Router): Promise<boolean> {
    return RouterNavigationHelper.navigateTo(router, ['/register']);
  }

  /**
   * Navigate with fallback route
   */
  static async navigateWithFallback(
    router: Router, 
    primaryRoute: string | string[], 
    fallbackRoute: string | string[] = ['/login']
  ): Promise<boolean> {
    try {
      const success = await RouterNavigationHelper.navigateTo(router, primaryRoute);
      if (!success) {
        return await RouterNavigationHelper.navigateTo(router, fallbackRoute);
      }
      return success;
    } catch {
      return await RouterNavigationHelper.navigateTo(router, fallbackRoute);
    }
  }
}