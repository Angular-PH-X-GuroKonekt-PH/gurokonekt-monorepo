import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../../shared/services/toast.service';
import { SecuritySetupService } from '../../../../core/security-setup/security-setup.service';
import {
  AuthenticationSettings,
  AuthenticationSettingsService,
} from '../../services/authentication-settings.service';

/** Admin > Authentication Settings: which sign-in methods every account must set up (#463). */
@Component({
  selector: 'app-authentication-settings-page',
  imports: [DatePipe],
  templateUrl: './authentication-settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticationSettingsPage implements OnInit {
  private readonly service = inject(AuthenticationSettingsService);
  private readonly securitySetup = inject(SecuritySetupService);
  private readonly toast = inject(ToastService);

  protected readonly saved = signal<AuthenticationSettings | null>(null);
  protected readonly passkeyRequired = signal(false);
  protected readonly googleIdpRequired = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dirty = computed(() => {
    const s = this.saved();
    return !!s && (s.passkeyRequired !== this.passkeyRequired() || s.googleIdpRequired !== this.googleIdpRequired());
  });

  ngOnInit(): void {
    this.service.get().subscribe({
      next: (settings) => {
        this.apply(settings);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Failed to load authentication settings.');
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    if (this.saving() || !this.dirty()) return;
    this.saving.set(true);
    this.service.save({ passkeyRequired: this.passkeyRequired(), googleIdpRequired: this.googleIdpRequired() }).subscribe({
      next: (response) => {
        this.apply(response.data as AuthenticationSettings);
        // Turning a requirement on applies to this admin as well.
        this.securitySetup.clear();
        this.toast.success(response.message, 'Settings saved');
        this.saving.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message || 'Failed to save authentication settings.');
        this.saving.set(false);
      },
    });
  }

  protected reset(): void {
    const s = this.saved();
    if (s) this.apply(s);
  }

  private apply(settings: AuthenticationSettings): void {
    this.saved.set(settings);
    this.passkeyRequired.set(settings.passkeyRequired);
    this.googleIdpRequired.set(settings.googleIdpRequired);
  }
}
