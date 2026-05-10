import { Component, input, output } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon.component';
import { AlertType } from '../../types/alert.types';
import {
  getAlertClasses,
  getAlertIcon,
  getIconClasses,
  getMessageClasses,
  getTitleClasses,
} from '../../utils/alert.util';
import { getContextIcon } from '../../utils/icon.util';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './alert.component.html'
})
export class AlertComponent {
  type = input<AlertType>('info');
  title = input<string>();
  message = input<string>();
  dismissible = input<boolean>(false);

  dismissed = output<void>();

  getAlertClasses(): string {
    return getAlertClasses(this.type());
  }

  getIconClasses(): string {
    return getIconClasses(this.type());
  }

  getTitleClasses(): string {
    return getTitleClasses(this.type());
  }

  getMessageClasses(): string {
    return getMessageClasses(this.type());
  }

  getDismissButtonClasses(): string {
    switch (this.type()) {
      case 'success':
        return 'text-green-400 bg-green-50 hover:bg-green-100 focus:ring-green-400';
      case 'error':
        return 'text-red-400 bg-red-50 hover:bg-red-100 focus:ring-red-400';
      case 'warning':
        return 'text-yellow-400 bg-yellow-50 hover:bg-yellow-100 focus:ring-yellow-400';
      case 'info':
        return 'text-blue-400 bg-blue-50 hover:bg-blue-100 focus:ring-blue-400';
      default:
        return 'text-gray-400 bg-gray-50 hover:bg-gray-100 focus:ring-gray-400';
    }
  }

  getIconPath(): string {
    return getAlertIcon(this.type());
  }

  getAlertIconName(): IconName {
    return getContextIcon(this.type());
  }

  getTitle(): string {
    const titleValue = this.title();
    if (titleValue) return titleValue;
    
    switch (this.type()) {
      case 'success':
        return 'Success!';
      case 'error':
        return 'Something went wrong!';
      case 'warning':
        return 'Warning!';
      case 'info':
        return 'Info';
      default:
        return 'Notice';
    }
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}