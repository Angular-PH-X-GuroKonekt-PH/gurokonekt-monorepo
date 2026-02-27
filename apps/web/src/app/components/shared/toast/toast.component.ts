import { Component, inject } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-md">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div
          [class]="getToastClasses(toast.type)"
          class="pointer-events-auto animate-slide-in-right shadow-lg rounded-xl p-4 border-2 backdrop-blur-sm transform transition-all duration-300 hover:scale-105"
          role="alert"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0 mt-0.5">
              <div [class]="getIconContainerClasses(toast.type)">
                <app-icon [name]="getIconName(toast.type)" class="w-5 h-5"></app-icon>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              @if (toast.title) {
                <h3 [class]="getTitleClasses(toast.type)">
                  {{ toast.title }}
                </h3>
              }
              <p [class]="getMessageClasses(toast.type)">
                {{ toast.message }}
              </p>
            </div>

            <!-- Close Button -->
            <button
              type="button"
              (click)="toastService.remove(toast.id)"
              [class]="getCloseButtonClasses(toast.type)"
              class="flex-shrink-0 rounded-lg p-1.5 inline-flex items-center justify-center hover:scale-110 transition-transform"
              [attr.aria-label]="'Close ' + toast.type + ' notification'"
            >
              <app-icon name="close" class="w-4 h-4"></app-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
  `]
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected getToastClasses(type: string): string {
    const baseClasses = 'relative';
    const typeClasses = {
      success: 'bg-green-50/95 border-green-200',
      error: 'bg-red-50/95 border-red-200',
      warning: 'bg-yellow-50/95 border-yellow-200',
      info: 'bg-blue-50/95 border-blue-200'
    };
    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || typeClasses.info}`;
  }

  protected getIconContainerClasses(type: string): string {
    const classes = {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  protected getIconName(type: string): 'alert-success' | 'alert-error' | 'alert-warning' | 'alert-info' {
    const icons = {
      success: 'alert-success' as const,
      error: 'alert-error' as const,
      warning: 'alert-warning' as const,
      info: 'alert-info' as const
    };
    return icons[type as keyof typeof icons] || icons.info;
  }

  protected getTitleClasses(type: string): string {
    const classes = {
      success: 'text-green-900 font-semibold text-sm',
      error: 'text-red-900 font-semibold text-sm',
      warning: 'text-yellow-900 font-semibold text-sm',
      info: 'text-blue-900 font-semibold text-sm'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  protected getMessageClasses(type: string): string {
    const classes = {
      success: 'text-green-800 text-sm mt-1',
      error: 'text-red-800 text-sm mt-1',
      warning: 'text-yellow-800 text-sm mt-1',
      info: 'text-blue-800 text-sm mt-1'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  protected getCloseButtonClasses(type: string): string {
    const classes = {
      success: 'text-green-600 hover:bg-green-100 focus:ring-green-400',
      error: 'text-red-600 hover:bg-red-100 focus:ring-red-400',
      warning: 'text-yellow-600 hover:bg-yellow-100 focus:ring-yellow-400',
      info: 'text-blue-600 hover:bg-blue-100 focus:ring-blue-400'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }
}
