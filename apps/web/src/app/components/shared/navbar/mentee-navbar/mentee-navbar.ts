import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';

import * as AuthActions from '../../../../store/auth/auth.actions';
import { AuthState } from '../../../../store/auth/auth.state';
import { ProfileService } from '../../../../services/profile.service';

type ProfileResponseShape = {
  user?: {
    avatarAttachments?: { publicUrl?: string } | { publicUrl?: string }[] | null;
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

@Component({
  selector: 'app-mentee-navbar',
  imports: [RouterLink],
  templateUrl: './mentee-navbar.html',
  styleUrl: './mentee-navbar.scss',
})
export class MenteeNavbar {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);

  protected readonly user = this.store.selectSignal(AuthState.user);
  protected readonly isUserMenuOpen = signal(false);
  protected readonly avatarUrl = signal<string | null>(null);

  protected readonly displayName = computed(() => {
    const currentUser = this.user();
    const fullName = currentUser?.['fullName'];

    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }

    const email = currentUser?.['email'];
    if (typeof email === 'string' && email.includes('@')) {
      return email.split('@')[0];
    }

    return 'Mentee';
  });

  protected readonly displayEmail = computed(() => {
    const email = this.user()?.['email'];
    return typeof email === 'string' && email.trim() ? email : 'No email available';
  });

  protected readonly initials = computed(() => {
    const name = this.displayName().trim();
    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return 'ME';
  });

  constructor() {
    this.loadProfileAvatar();
  }


  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }

 

  private loadProfileAvatar(): void {
    const userId = this.user()?.['id'];
    if (typeof userId !== 'string' || !userId.trim()) {
      return;
    }

    this.profileService
      .getUserProfile(userId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          const avatar = this.extractAvatarUrl(response.data as ProfileResponseShape | null);
          this.avatarUrl.set(avatar);
        },
        error: () => {
          this.avatarUrl.set(null);
        },
      });
  }

  private extractAvatarUrl(profile: ProfileResponseShape | null): string | null {
    const avatarAttachments = profile?.user?.avatarAttachments;

    if (Array.isArray(avatarAttachments)) {
      return avatarAttachments[0]?.publicUrl ?? null;
    }

    if (avatarAttachments && typeof avatarAttachments === 'object') {
      return avatarAttachments.publicUrl ?? null;
    }

    return null;
  }
}
