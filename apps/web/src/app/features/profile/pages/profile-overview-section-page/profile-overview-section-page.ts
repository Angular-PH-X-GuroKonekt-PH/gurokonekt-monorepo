import { Component, computed, effect, inject, signal } from '@angular/core';
import { Store } from '@ngxs/store';

import { ProfileService } from '../../profile.service';
import { AuthState } from '../../../../core/auth/store/auth.state';

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
  selector: 'app-profile-overview-section',
  standalone: true,
  templateUrl: './profile-overview-section-page.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ProfileOverviewSectionPage {
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
      return 'M';
    }

    const fullName = activeProfile.fullName.trim();
    if (!fullName) {
      return 'M';
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
    const fullName = `${firstName} ${lastName}`.trim() || fallbackFullName || 'Mentor';

    const avatarRecord = this.getAvatarRecord(source['avatarAttachments']);

    return {
      firstName,
      lastName,
      fullName,
      email: this.getString(source['email']),
      role: this.getString(source['role']) || 'mentor',
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
