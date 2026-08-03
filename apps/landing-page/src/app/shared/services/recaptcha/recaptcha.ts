import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { APP_CONFIG } from '../../../../environments/app-config.token';

/** Minimal shape of the global Google injects. */
interface Grecaptcha {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

export const RECAPTCHA_SCRIPT_ID = 'gurokonekt-recaptcha';

/** Raised when a token cannot be produced. Callers show a user-facing message. */
export class RecaptchaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecaptchaUnavailableError';
  }
}

/**
 * Loads Google reCAPTCHA v3 and mints tokens.
 *
 * The landing page prerenders every route at build time, so the script is only
 * ever injected in the browser — touching `document` during prerender would
 * crash the build.
 *
 * v3 has no widget and no visible state, so there is nothing to "reset" after a
 * submission. Tokens are single-use and expire after roughly two minutes, so one
 * is minted per submit attempt rather than once per page load.
 */
@Injectable({ providedIn: 'root' })
export class Recaptcha {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Shared across callers so the script is only ever injected once. */
  private loader?: Promise<Grecaptcha>;

  get isConfigured(): boolean {
    return !!this.appConfig.RECAPTCHA_SITE_KEY;
  }

  /**
   * Returns a fresh token for the given action.
   *
   * @throws RecaptchaUnavailableError when the script cannot load, the site key
   * is missing, or this is running on the server.
   */
  async execute(action: string): Promise<string> {
    if (!this.isBrowser) {
      throw new RecaptchaUnavailableError(
        'reCAPTCHA is only available in the browser.',
      );
    }

    if (!this.isConfigured) {
      throw new RecaptchaUnavailableError(
        'RECAPTCHA_SITE_KEY is not configured.',
      );
    }

    const grecaptcha = await this.load();
    return grecaptcha.execute(this.appConfig.RECAPTCHA_SITE_KEY, { action });
  }

  private load(): Promise<Grecaptcha> {
    if (this.loader) return this.loader;

    this.loader = new Promise<Grecaptcha>((resolve, reject) => {
      const existing = window.grecaptcha;
      if (existing) {
        existing.ready(() => resolve(existing));
        return;
      }

      const script = document.createElement('script');
      script.id = RECAPTCHA_SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
        this.appConfig.RECAPTCHA_SITE_KEY,
      )}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        const loaded = window.grecaptcha;
        if (!loaded) {
          reject(
            new RecaptchaUnavailableError(
              'reCAPTCHA loaded but did not register itself.',
            ),
          );
          return;
        }
        loaded.ready(() => resolve(loaded));
      };

      // Ad blockers and privacy extensions routinely block this script. Reject
      // so the form can say something useful instead of hanging.
      script.onerror = () => {
        this.loader = undefined;
        reject(
          new RecaptchaUnavailableError('Could not load reCAPTCHA.'),
        );
      };

      document.head.appendChild(script);
    });

    return this.loader;
  }
}
