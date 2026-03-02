import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  private toastCounter = 0;

  readonly toasts$ = this.toasts.asReadonly();

  /**
   * Show a success toast notification
   */
  success(message: string, title?: string, duration = 5000): void {
    this.show({
      type: 'success',
      message,
      title: title || 'Success',
      duration
    });
  }

  /**
   * Show an error toast notification
   */
  error(message: string, title?: string, duration = 5000): void {
    this.show({
      type: 'error',
      message,
      title: title || 'Error',
      duration
    });
  }

  /**
   * Show a warning toast notification
   */
  warning(message: string, title?: string, duration = 5000): void {
    this.show({
      type: 'warning',
      message,
      title: title || 'Warning',
      duration
    });
  }

  /**
   * Show an info toast notification
   */
  info(message: string, title?: string, duration = 5000): void {
    this.show({
      type: 'info',
      message,
      title: title || 'Info',
      duration
    });
  }

  /**
   * Show a toast notification
   */
  private show(config: Omit<Toast, 'id'>): void {
    const id = `toast-${++this.toastCounter}`;
    const toast: Toast = { ...config, id };

    this.toasts.update(toasts => [...toasts, toast]);

    // Auto-remove toast after duration
    if (config.duration && config.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, config.duration);
    }
  }

  /**
   * Remove a toast by ID
   */
  remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Remove all toasts
   */
  clear(): void {
    this.toasts.set([]);
  }
}
