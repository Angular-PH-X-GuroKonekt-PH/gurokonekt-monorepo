import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { catchError, concat, map, of, switchMap } from 'rxjs';

import { AuthUser } from '@gurokonekt/models/interfaces/auth/auth-user.interface';
import { UserRole } from '@gurokonekt/models/interfaces/user/user.model';
import { ProfileService } from '../../profile.service';
import { AuthSelectors } from '../../../auth/store/auth.selectors';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { resolveAvatarPublicUrl } from '../../../../shared/utils/avatar-url.util';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface OverviewData {
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string;
}

interface ProfileLoadState {
  loading: boolean;
  error: string | null;
  data: OverviewData | null;
}

const INITIAL_LOAD_STATE: ProfileLoadState = {
  loading: false,
  error: null,
  data: null,
};

@Component({
  selector: 'app-profile-overview-section',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './profile-overview-section.page.html',
  host: { class: 'block' },
})
export class ProfileOverviewSectionPage {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  private readonly user = this.store.selectSignal(AuthSelectors.user);
  private readonly userId = computed(() => this.user()?.id ?? null);

  private readonly profileLoad = toSignal(
    toObservable(this.userId).pipe(
      switchMap((userId) => {
        if (!userId) {
          return of(INITIAL_LOAD_STATE);
        }

        return concat(
          of<ProfileLoadState>({ loading: true, error: null, data: null }),
          this.profileService.getUserProfile(userId).pipe(
            map((response): ProfileLoadState => ({
              loading: false,
              error: null,
              data:
                response.data && typeof response.data === 'object'
                  ? this.toOverviewData(response.data as Record<string, unknown>)
                  : null,
            })),
            catchError((error: { message?: string }) =>
              of<ProfileLoadState>({
                loading: false,
                error: error.message ?? 'Unable to load profile overview right now.',
                data: null,
              })
            )
          )
        );
      })
    ),
    { initialValue: INITIAL_LOAD_STATE }
  );

  protected readonly isLoading = computed(() => this.profileLoad().loading);
  protected readonly errorMessage = computed(() => this.profileLoad().error);

  protected readonly profile = computed(() => {
    const fetched = this.profileLoad().data;
    if (fetched) {
      return fetched;
    }

    const activeUser = this.user();
    return activeUser ? this.toOverviewData(activeUser) : null;
  });

  protected readonly initials = computed(() => {
    const fullName = this.profile()?.fullName.trim();
    if (!fullName) {
      return '?';
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
  protected readonly isMentor = computed(
    () => (this.profile()?.role ?? '').toLowerCase() === UserRole.Mentor
  );
  protected readonly overviewDescription = computed(() =>
    this.isMentor()
      ? 'Review your mentor profile basics and account identity details.'
      : 'Review your mentee profile basics and account identity details.'
  );

  protected onEdit(): void {
    void this.router.navigate([`/${APP_ROUTES.SETTINGS_EDIT}`]);
  }

  private toOverviewData(source: AuthUser | Record<string, unknown>): OverviewData {
    const s = source as Record<string, unknown>;
    const firstName = this.asString(s['firstName']);
    const lastName = this.asString(s['lastName']);
    const fallbackFullName = this.asString(s['fullName']);
    const fullName = `${firstName} ${lastName}`.trim() || fallbackFullName || 'User';
    const authUser = this.user();

    return {
      fullName,
      email: this.asString(s['email']) || this.asString(authUser?.email),
      role: this.asString(s['role']) || this.asString(authUser?.role) || UserRole.Mentee,
      status: this.asString(s['status']) || 'active',
      avatarUrl: resolveAvatarPublicUrl(
        s as {
          avatarAttachments?:
            | { publicUrl?: string | null }
            | { publicUrl?: string | null }[]
            | null;
        },
        ''
      ),
    };
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private mapRoleLabel(role?: string): string {
    const normalizedRole = (role ?? '').toLowerCase().trim();

    if (normalizedRole === UserRole.Mentor) {
      return 'Mentor';
    }

    if (normalizedRole === UserRole.Mentee) {
      return 'Mentee';
    }

    if (normalizedRole === 'admin') {
      return 'Admin';
    }

    return 'Mentee';
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
