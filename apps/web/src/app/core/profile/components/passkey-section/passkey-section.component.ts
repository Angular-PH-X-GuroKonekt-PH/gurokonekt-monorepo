import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { PasskeySummaryInterface } from '@gurokonekt/models/interfaces/passkey/passkey.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { describeThisDevice, PasskeyService } from '../../../auth/services/passkey.service';

/**
 * "Passkeys" card in Profile Settings: lets a signed-in mentee or mentor add a
 * passkey (device biometrics, PIN or a password manager). Listing and removing
 * passkeys come later with passkey management.
 */
@Component({
  selector: 'app-passkey-section',
  imports: [IconComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div class="flex gap-4">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <app-icon name="locked-closed" class="h-6 w-6"></app-icon>
          </span>
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Passkeys</h3>
            <p class="mt-1 max-w-xl text-sm text-slate-500">
              Sign in with your fingerprint, face, screen lock or password manager instead of a password.
              Your passkey stays on your device; GuroKonekt never sees it.
            </p>
          </div>
        </div>

        @if (isSupported) {
          <button
            type="button"
            (click)="addPasskey()"
            [disabled]="isAdding()"
            class="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            @if (isAdding()) {
              <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Waiting for your device...
            } @else {
              Add a passkey
            }
          </button>
        }
      </div>

      @if (!isSupported) {
        <p class="border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600 sm:px-7" role="status">
          This browser or device doesn't support passkeys. Try an up-to-date version of Chrome, Safari, Edge or Firefox,
          or use your phone.
        </p>
      }

      @if (addedPasskey(); as passkey) {
        <div class="flex items-center gap-3 border-t border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 sm:px-7" role="status">
          <app-icon name="check-mark-circle" class="h-5 w-5 shrink-0"></app-icon>
          <span>
            <span class="font-semibold">{{ passkey.name }}</span> was added on {{ passkey.createdAt | date: 'mediumDate' }}.
          </span>
        </div>
      }
    </section>
  `,
})
export class PasskeySectionComponent {
  private readonly passkeyService = inject(PasskeyService);
  private readonly toastService = inject(ToastService);

  protected readonly isSupported = this.passkeyService.isSupported();
  protected readonly isAdding = signal(false);
  protected readonly addedPasskey = signal<PasskeySummaryInterface | null>(null);

  protected async addPasskey(): Promise<void> {
    if (this.isAdding()) {
      return;
    }

    this.isAdding.set(true);
    try {
      const result = await this.passkeyService.register(describeThisDevice());
      switch (result.status) {
        case 'added':
          this.addedPasskey.set(result.passkey);
          this.toastService.success(result.message, 'Passkey added');
          break;
        case 'cancelled':
          this.toastService.info('No passkey was added.', 'Passkey setup cancelled');
          break;
        case 'failed':
          this.toastService.error(result.message, "Couldn't add passkey");
          break;
      }
    } finally {
      this.isAdding.set(false);
    }
  }
}
