import { effect, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ToastService } from '../../../shared/services/toast.service';
import { ClearAuthMessages } from '../store/auth.actions';

/**
 * Watches auth store success/error messages after a registration attempt.
 * Must be called in an injection context (e.g. constructor).
 */
export function watchRegistrationOutcome(options: {
  successMessage: Signal<string | null | undefined>;
  errorMessage: Signal<string | null | undefined>;
  /** Where to go after success; a function when it depends on how the person registered. */
  confirmationRoute: string | (() => string);
  store: Store;
  toastService: ToastService;
  router: Router;
  onSuccess: () => void;
  onError: (message: string) => void;
}): void {
  let lastSuccessNotified: string | null = null;
  let lastErrorNotified: string | null = null;

  effect(() => {
    const successMsg = options.successMessage();
    const errorMsg = options.errorMessage();

    if (successMsg && successMsg !== lastSuccessNotified) {
      lastSuccessNotified = successMsg;
      options.onSuccess();
      options.toastService.success(successMsg, 'Welcome to GuroKonekt!');
      options.store.dispatch(new ClearAuthMessages());
      const route =
        typeof options.confirmationRoute === 'function' ? options.confirmationRoute() : options.confirmationRoute;
      // navigateByUrl so a route may carry a query string (e.g. ?via=google).
      options.router.navigateByUrl(`/${route}`);
    }

    if (errorMsg && errorMsg !== lastErrorNotified) {
      lastErrorNotified = errorMsg;
      options.onError(errorMsg);
      options.toastService.error(errorMsg, 'Registration Failed');
      options.store.dispatch(new ClearAuthMessages());
    }

    if (!successMsg) {
      lastSuccessNotified = null;
    }
    if (!errorMsg) {
      lastErrorNotified = null;
    }
  });
}
