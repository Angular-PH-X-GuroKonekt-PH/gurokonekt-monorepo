export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  dismissible?: boolean;
}

export class AlertHelper {
  static getAlertClasses(type: AlertType): string {
    const baseClasses = 'p-4 rounded-md border-l-4 border';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-green-500 bg-green-50 border-green-200`;
      case 'error':
        return `${baseClasses} border-l-red-500 bg-red-50 border-red-200`;
      case 'warning':
        return `${baseClasses} border-l-yellow-500 bg-yellow-50 border-yellow-200`;
      case 'info':
        return `${baseClasses} border-l-blue-500 bg-blue-50 border-blue-200`;
      default:
        return `${baseClasses} border-l-gray-500 bg-gray-50 border-gray-200`;
    }
  }

  static getIconClasses(type: AlertType): string {
    switch (type) {
      case 'success':
        return 'w-4 h-4 text-green-600';
      case 'error':
        return 'w-4 h-4 text-red-600';
      case 'warning':
        return 'w-4 h-4 text-yellow-600';
      case 'info':
        return 'w-4 h-4 text-blue-600';
      default:
        return 'w-4 h-4 text-gray-600';
    }
  }

  static getTitleClasses(type: AlertType): string {
    switch (type) {
      case 'success':
        return 'text-sm font-semibold text-green-800';
      case 'error':
        return 'text-sm font-semibold text-red-800';
      case 'warning':
        return 'text-sm font-semibold text-yellow-800';
      case 'info':
        return 'text-sm font-semibold text-blue-800';
      default:
        return 'text-sm font-semibold text-gray-800';
    }
  }

  static getMessageClasses(type: AlertType): string {
    switch (type) {
      case 'success':
        return 'mt-1 text-sm text-green-700';
      case 'error':
        return 'mt-1 text-sm text-red-700';
      case 'warning':
        return 'mt-1 text-sm text-yellow-700';
      case 'info':
        return 'mt-1 text-sm text-blue-700';
      default:
        return 'mt-1 text-sm text-gray-700';
    }
  }

  static getIcon(type: AlertType): string {
    switch (type) {
      case 'success':
        return '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.06a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />';
      case 'error':
        return '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />';
      case 'warning':
        return '<path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />';
      case 'info':
        return '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />';
      default:
        return '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />';
    }
  }
}