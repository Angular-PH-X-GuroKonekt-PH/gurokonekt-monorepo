import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { environment } from '../../../../../environments/environment';

// hl=en: Google picks the button language when the script loads, from the browser or
// account language; the per-button locale alone doesn't override it. The app is English.
const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client?hl=en';
const MAX_BUTTON_WIDTH = 400; // Google's limit for rendered buttons
const MIN_BUTTON_WIDTH = 200; // Google's smallest rendered width
const RESIZE_DEBOUNCE_MS = 150;

/** The parts of Google Identity Services this component uses. */
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    nonce?: string;
    ux_mode?: 'popup' | 'redirect';
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    }
  ): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

export interface GoogleCredential {
  idToken: string;
  /** Raw nonce. Google embeds its SHA-256 hash in the token; the API checks they match. */
  nonce: string;
}

let scriptLoading: Promise<GoogleAccountsId> | null = null;

/** Loads the Google Identity Services script once per page and resolves with its API. */
function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);

  scriptLoading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const api = window.google?.accounts?.id;
      if (api) {
        resolve(api);
      } else {
        reject(new Error('Google Identity Services loaded without its API'));
      }
    };
    script.onerror = () => reject(new Error('Google Identity Services failed to load'));
    document.head.appendChild(script);
  }).catch((error) => {
    // Let a later visit to the page try again (e.g. after the network recovers).
    scriptLoading = null;
    throw error;
  });

  return scriptLoading;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return { raw, hashed: toHex(new Uint8Array(digest)) };
}

/**
 * Renders Google's official "Continue with Google" button and emits the ID
 * token once the user picks an account. Closing Google's popup emits nothing,
 * so a cancelled sign-in simply leaves the user on the page.
 */
@Component({
  selector: 'app-google-sign-in-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (clientId) {
      <!-- Same size and shape as the other sign-in buttons (see auth-provider-button styles). -->
      <div class="relative mx-auto h-10 w-full max-w-[400px]">
        <div #buttonHost class="flex h-10 w-full justify-center" [class.invisible]="state() !== 'ready'"></div>

        @if (state() === 'loading') {
          <div class="absolute inset-0 rounded-full bg-gray-100 animate-pulse" aria-hidden="true"></div>
        }

        @if ((disabled() || loading()) && state() === 'ready') {
          <!-- Google's button is an iframe and cannot be disabled; this blocks clicks while a sign-in is running. -->
          <div class="absolute inset-0 flex cursor-not-allowed items-center justify-center rounded-full bg-white/70" aria-hidden="true">
            @if (loading()) {
              <span class="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></span>
            }
          </div>
        }
      </div>

      @if (state() === 'unavailable') {
        <p class="mt-2 text-center text-sm text-gray-500" role="status">
          Google sign-in is unavailable right now. Please sign in with your email and password.
        </p>
      }
    }
  `,
})
export class GoogleSignInButton {
  private readonly zone = inject(NgZone);
  private readonly buttonHost = viewChild<ElementRef<HTMLElement>>('buttonHost');

  private readonly destroyRef = inject(DestroyRef);

  readonly disabled = input(false);
  /** Shows a spinner over the button while this Google sign-in is being processed. */
  readonly loading = input(false);
  /** Button wording: "Sign in with Google", "Continue with Google" or "Sign up with Google". */
  readonly text = input<'signin_with' | 'continue_with' | 'signup_with'>('signin_with');
  readonly credential = output<GoogleCredential>();

  protected readonly clientId = environment.googleClientId;
  protected readonly state = signal<'loading' | 'ready' | 'unavailable'>('loading');

  constructor() {
    afterNextRender(() => {
      if (this.clientId) {
        void this.setUp();
      }
    });
  }

  private async setUp(): Promise<void> {
    try {
      const [googleId, nonce] = await Promise.all([loadGoogleIdentity(), createNonce()]);
      const host = this.buttonHost()?.nativeElement;
      if (!host) return;

      googleId.initialize({
        client_id: this.clientId,
        nonce: nonce.hashed,
        ux_mode: 'popup',
        // Google calls back outside Angular's zone.
        callback: ({ credential }) =>
          this.zone.run(() => {
            if (credential && !this.disabled()) {
              this.credential.emit({ idToken: credential, nonce: nonce.raw });
            }
          }),
      });

      this.render(googleId, host);
      this.state.set('ready');
      this.rerenderOnResize(googleId, host);
    } catch (error) {
      // Blocked by an extension, offline, or a CSP — fall back to password login.
      console.warn('Google Sign-In unavailable:', (error as Error).message);
      this.state.set('unavailable');
    }
  }

  private renderedWidth = 0;

  /** Google draws its own button at a fixed pixel width, so it follows the container's width. */
  private render(googleId: GoogleAccountsId, host: HTMLElement): void {
    const width = Math.round(
      Math.max(MIN_BUTTON_WIDTH, Math.min(host.clientWidth || MAX_BUTTON_WIDTH, MAX_BUTTON_WIDTH))
    );
    this.renderedWidth = width;
    host.replaceChildren();
    googleId.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: this.text(),
      shape: 'pill',
      logo_alignment: 'left',
      width,
      // Google otherwise follows the browser/account language; the rest of the app is English.
      locale: 'en',
    });
  }

  /** Redraws the button when the layout changes width (rotating a phone, resizing a window). */
  private rerenderOnResize(googleId: GoogleAccountsId, host: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const target = Math.min(host.clientWidth, MAX_BUTTON_WIDTH);
        if (Math.abs(target - this.renderedWidth) >= 8) {
          this.render(googleId, host);
        }
      }, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(host);
    this.destroyRef.onDestroy(() => {
      clearTimeout(timer);
      observer.disconnect();
    });
  }
}
