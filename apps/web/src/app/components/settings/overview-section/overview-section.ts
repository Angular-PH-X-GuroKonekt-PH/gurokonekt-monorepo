import { Component, computed, effect, inject, signal } from '@angular/core';
import { Store } from '@ngxs/store';

import { ProfileService } from '../../../services/profile.service';
import { AuthState } from '../../../store/auth/auth.state';

interface AvatarRecord {
  publicUrl?: string;
}

interface OverviewData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-overview-section',
  standalone: true,
  template: `
    <section>
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Overview Section</h2>
          <p class="mt-1 text-sm text-gray-600">{{ sectionDescription() }}</p>
        </div>

        <button
          type="button"
          (click)="toggleEditMode()"
          class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          {{ isEditMode() ? 'Close Edit' : 'Edit' }}
        </button>
      </div>

      @if (isLoading()) {
        <p class="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Loading profile overview...
        </p>
      }

      @if (errorMessage()) {
        <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMessage() }}
        </p>
      }

      @if (profile(); as currentProfile) {
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            @if (currentProfile.avatarUrl) {
              <img
                [src]="currentProfile.avatarUrl"
                alt="Profile picture"
                class="h-20 w-20 rounded-full border border-gray-200 object-cover"
              />
            } @else {
              <div class="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {{ initials() }}
              </div>
            }

            <div class="flex-1">
              <h3 class="text-xl font-semibold text-gray-900">{{ currentProfile.fullName }}</h3>
              <p class="mt-1 text-sm text-gray-600">Profile picture and basic account info</p>
            </div>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</p>
              <p class="mt-1 text-base font-medium text-gray-900">{{ currentProfile.fullName }}</p>
            </div>

            <div>
              <label for="mentor-email" class="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
              <input
                id="mentor-email"
                type="email"
                [value]="currentProfile.email"
                readonly
                class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
              />
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Account Type</p>
              <p class="mt-1 text-base font-medium text-gray-900">{{ accountTypeLabel() }}</p>
            </div>

            @if (!isMentee()) {
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Mentor Status</p>
                <p class="mt-1 text-base font-medium text-gray-900">{{ statusLabel() }}</p>
              </div>
            }
          </div>
        </div>

        @if (isEditMode()) {
          <div class="mt-4 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            Inline editing mode is ready for the next story implementation.
          </div>
        }
      } @else if (!isLoading()) {
        <p class="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          No profile information is available yet.
        </p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class OverviewSection {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);

  private readonly user = this.store.selectSignal(AuthState.user);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly profile = signal<OverviewData | null>(null);

  protected readonly initials = computed(() => {
    const activeProfile = this.profile();

    if (!activeProfile) {
      return '--';
    }

    const fullName = activeProfile.fullName.trim();
    if (!fullName) {
      return '--';
    }

    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  protected readonly statusLabel = computed(() => this.mapStatusLabel(this.profile()?.status));
  protected readonly accountTypeLabel = computed(() => this.mapRoleLabel(this.profile()?.role));
  protected readonly isMentee = computed(() => (this.profile()?.role ?? '').toLowerCase().trim() === 'mentee');
  protected readonly sectionDescription = computed(() =>
    this.isMentee()
      ? 'Review your basic account and identity details.'
      : 'Review your mentor profile basics and account identity details.',
  );

  constructor() {
    effect(() => {
      const activeUser = this.user();
      if (!activeUser) {
        this.profile.set(null);
        return;
      }

      this.profile.set(this.toOverviewData(activeUser));

      const userId = this.getString(activeUser['id']);
      if (userId) {
        this.fetchUserProfile(userId);
      }
    });
  }

  protected toggleEditMode(): void {
    this.isEditMode.update((value) => !value);
  }

  private fetchUserProfile(userId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.profileService.getUserProfile(userId).subscribe({
      next: (response) => {
        if (response.data && typeof response.data === 'object') {
          this.profile.set(this.toOverviewData(response.data as Record<string, unknown>));
        }
        this.isLoading.set(false);
      },
      error: (error: { message?: string }) => {
        this.errorMessage.set(error.message ?? 'Unable to load profile overview right now.');
        this.isLoading.set(false);
      },
    });
  }

  private toOverviewData(source: Record<string, unknown>): OverviewData {
    const firstName = this.getString(source['firstName']);
    const lastName = this.getString(source['lastName']);
    const fallbackFullName = this.getString(source['fullName']);
    const fullName = `${firstName} ${lastName}`.trim() || fallbackFullName || 'User';

    const avatarRecord = this.getAvatarRecord(source['avatarAttachments']);

    return {
      firstName,
      lastName,
      fullName,
      email: this.getString(source['email']),
      role: this.getString(source['role']),
      status: this.getString(source['status']) || 'pending_approval',
      avatarUrl: this.getString(avatarRecord?.publicUrl),
    };
  }

  private getAvatarRecord(value: unknown): AvatarRecord | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as AvatarRecord;
  }

  private getString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private mapRoleLabel(role?: string): string {
    const normalizedRole = (role ?? '').toLowerCase().trim();

    if (normalizedRole === 'mentor') {
      return 'Mentor';
    }

    if (normalizedRole === 'mentee') {
      return 'Mentee';
    }

    if (normalizedRole === 'admin') {
      return 'Admin';
    }

    return 'Mentor';
  }

  private mapStatusLabel(status?: string): string {
    const normalizedStatus = (status ?? '').toLowerCase().trim();

    if (normalizedStatus === 'active' || normalizedStatus === 'approved') {
      return 'Active';
    }

    if (normalizedStatus === 'inactive') {
      return 'Inactive';
    }

    if (normalizedStatus === 'rejected') {
      return 'Rejected';
    }

    return 'Pending';
  }
}
