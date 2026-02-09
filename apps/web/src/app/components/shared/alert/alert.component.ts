import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { AlertHelper, AlertType } from '../../../helpers/alert.helper';
import { IconHelper } from '../../../helpers/icon.helper';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './alert.component.html'
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() title?: string;
  @Input() message?: string;
  @Input() dismissible = false;

  @Output() dismissed = new EventEmitter<void>();

  private readonly alertHelper = AlertHelper;

  getAlertClasses(): string {
    return this.alertHelper.getAlertClasses(this.type);
  }

  getIconClasses(): string {
    return this.alertHelper.getIconClasses(this.type);
  }

  getTitleClasses(): string {
    return this.alertHelper.getTitleClasses(this.type);
  }

  getMessageClasses(): string {
    return this.alertHelper.getMessageClasses(this.type);
  }

  getDismissButtonClasses(): string {
    switch (this.type) {
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
    return this.alertHelper.getIcon(this.type);
  }

  getAlertIconName(): IconName {
    return IconHelper.getContextIcon(this.type);
  }

  getTitle(): string {
    if (this.title) return this.title;
    
    switch (this.type) {
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