import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import type { PasskeySummaryInterface } from '@gurokonekt/models/interfaces/passkey/passkey.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { rememberPostLoginRedirect } from '../../../../shared/utils/post-login-redirect.util';
import { Logout } from '../../../auth/store/auth.actions';
import { describeThisDevice, PasskeyService } from '../../../auth/services/passkey.service';

const NAME_MAX_LENGTH = 60;

/**
 * Settings > Passkeys: shows whether passkey sign-in is set up, lists the
 * account's passkeys, and lets the person add, rename and remove them.
 * Removing needs a recent sign-in; if it's too old the page offers to sign
 * in again and brings the person back here afterwards.
 */
@Component({
  selector: 'app-passkeys-section-page',
  imports: [IconComponent, DatePipe, FormsModule],
  templateUrl: './passkeys-section.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasskeysSectionPage implements OnInit {
  private readonly passkeyService = inject(PasskeyService);
  private readonly toastService = inject(ToastService);
  private readonly store = inject(Store);

  protected readonly nameMaxLength = NAME_MAX_LENGTH;
  protected readonly isSupported = this.passkeyService.isSupported();
  protected readonly passkeys = signal<PasskeySummaryInterface[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly isAdding = signal(false);
  /** Passkey being renamed, and the draft name. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly draftName = signal('');
  /** Passkey waiting for "yes, remove it". */
  protected readonly confirmingRemoveId = signal<string | null>(null);
  /** A rename or remove in progress. */
  protected readonly busyId = signal<string | null>(null);
  protected readonly reauthMessage = signal<string | null>(null);

  protected readonly count = computed(() => this.passkeys().length);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    try {
      this.passkeys.set(await this.passkeyService.list());
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async addPasskey(): Promise<void> {
    if (this.isAdding()) {
      return;
    }

    this.isAdding.set(true);
    try {
      const result = await this.passkeyService.register(describeThisDevice());
      switch (result.status) {
        case 'added':
          this.passkeys.update((list) => [result.passkey, ...list]);
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

  protected startRename(passkey: PasskeySummaryInterface): void {
    this.confirmingRemoveId.set(null);
    this.editingId.set(passkey.id);
    this.draftName.set(passkey.name);
    // Put the cursor in the name field once it renders, for keyboard users too.
    setTimeout(() => document.getElementById(`passkey-name-${passkey.id}`)?.focus());
  }

  protected cancelRename(): void {
    this.editingId.set(null);
  }

  protected async saveRename(passkey: PasskeySummaryInterface): Promise<void> {
    const name = this.draftName().trim();
    if (!name || name === passkey.name) {
      this.cancelRename();
      return;
    }

    this.busyId.set(passkey.id);
    const result = await this.passkeyService.rename(passkey.id, name);
    this.busyId.set(null);

    if (result.status === 'done') {
      this.passkeys.update((list) => list.map((item) => (item.id === passkey.id ? result.data : item)));
      this.editingId.set(null);
      this.toastService.success(result.message, 'Passkey renamed');
    } else {
      this.toastService.error(result.message, "Couldn't rename passkey");
    }
  }

  protected askToRemove(passkey: PasskeySummaryInterface): void {
    this.editingId.set(null);
    this.confirmingRemoveId.set(passkey.id);
  }

  protected cancelRemove(): void {
    this.confirmingRemoveId.set(null);
  }

  protected async confirmRemove(passkey: PasskeySummaryInterface): Promise<void> {
    this.busyId.set(passkey.id);
    const result = await this.passkeyService.remove(passkey.id);
    this.busyId.set(null);
    this.confirmingRemoveId.set(null);

    switch (result.status) {
      case 'done':
        this.passkeys.update((list) => list.filter((item) => item.id !== passkey.id));
        this.toastService.success(result.message, 'Passkey removed');
        break;
      case 'reauth-required':
        this.reauthMessage.set(result.message);
        break;
      case 'failed':
        this.toastService.error(result.message, "Couldn't remove passkey");
        break;
    }
  }

  /** Signs out and comes back here after the next sign-in. */
  protected signInAgain(): void {
    rememberPostLoginRedirect(`/${APP_ROUTES.SETTINGS_PASSKEYS}`);
    this.toastService.info('Sign in again, then you can remove the passkey.', 'Confirm it’s you');
    this.store.dispatch(new Logout());
  }

  protected isSynced(passkey: PasskeySummaryInterface): boolean {
    return passkey.backedUp || passkey.deviceType === 'multiDevice';
  }
}
