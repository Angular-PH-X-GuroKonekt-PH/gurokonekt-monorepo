import { IconName } from '../components/shared/icon/icon.component';

/**
 * Helper for icon management and dynamic icon selection
 */
export class IconHelper {
  /**
   * Get appropriate icon for different contexts
   */
  static getContextIcon(context: 'success' | 'error' | 'warning' | 'info'): IconName {
    const contextIcons: Record<string, IconName> = {
      'success': 'alert-success',
      'error': 'alert-error', 
      'warning': 'alert-warning',
      'info': 'alert-info'
    };

    return contextIcons[context] || 'alert-info';
  }

  /**
   * Get icon for user roles
   */
  static getRoleIcon(role: 'mentee' | 'mentor' | 'admin'): IconName {
    const roleIcons: Record<string, IconName> = {
      'mentee': 'academic-cap',
      'mentor': 'user-group',
      'admin': 'cog-6-tooth'
    };

    return roleIcons[role] || 'user';
  }

  /**
   * Get icon for navigation items
   */
  static getNavigationIcon(navItem: string): IconName {
    const navIcons: Record<string, IconName> = {
      'dashboard': 'chart-bar',
      'profile': 'user',
      'settings': 'cog-6-tooth',
      'mentoring': 'users',
      'calendar': 'calendar-days',
      'messages': 'chat-bubble-left-right',
      'notifications': 'bell',
      'reports': 'chart-bar-square',
      'help': 'book-open',
      'logout': 'arrow-trending-up'
    };

    return navIcons[navItem] || 'cursor-arrow-rays';
  }

  /**
   * Get icon for form field types
   */
  static getFieldIcon(fieldType: 'email' | 'password' | 'phone' | 'location' | 'calendar'): IconName {
    const fieldIcons: Record<string, IconName> = {
      'email': 'user',
      'password': 'eye-off',
      'phone': 'bell',
      'location': 'map-pin',
      'calendar': 'calendar-days'
    };

    return fieldIcons[fieldType] || 'user';
  }

  /**
   * Get status indicator icon
   */
  static getStatusIcon(status: 'active' | 'inactive' | 'pending' | 'verified' | 'rejected'): IconName {
    const statusIcons: Record<string, IconName> = {
      'active': 'check-mark',
      'inactive': 'close',
      'pending': 'bell', // Using bell as pending indicator instead of clock
      'verified': 'alert-success',
      'rejected': 'alert-error'
    };

    return statusIcons[status] || 'alert-info';
  }

  /**
   * Get icon classes for different sizes
   */
  static getSizeClasses(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string {
    const sizeClasses: Record<string, string> = {
      'xs': 'h-3 w-3',
      'sm': 'h-4 w-4',
      'md': 'h-5 w-5',
      'lg': 'h-6 w-6',
      'xl': 'h-8 w-8'
    };

    return sizeClasses[size] || 'h-5 w-5';
  }

  /**
   * Check if an icon exists in the available icons
   */
  static isValidIcon(iconName: string): boolean {
    const allIcons: IconName[] = [
      'hand-raised', 'chart-bar-square', 'users', 'calendar-days',
      'chart-bar', 'chat-bubble-left-right', 'book-open', 'bell',
      'user', 'cog-6-tooth', 'target', 'rocket-launch', 'user-group',
      'wrench-screwdriver', 'map-pin', 'academic-cap', 'light-bulb',
      'arrow-trending-up', 'cursor-arrow-rays', 'eye', 'eye-off',
      'chevron-down', 'chevron-left', 'chevron-right', 'check-mark',
      'close', 'alert-success', 'alert-error', 'alert-warning', 'alert-info'
    ];

    return allIcons.includes(iconName as IconName);
  }
}