import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

import { UserInterface } from '@gurokonekt/models';

import * as AuthActions from '../../../../store/auth/auth.actions';
import { AuthState } from '../../../../store/auth/auth.state';
import { ProfileService } from '../../../../services/profile.service';
import { IconComponent } from "../../icon/icon.component";

@Component({
  selector: 'app-mentor-navbar',
  imports: [RouterLink, CommonModule, IconComponent],
  templateUrl: './mentor-navbar.html',
  styleUrl: './mentor-navbar.scss',
})
export class MentorNavbar implements OnInit {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  protected readonly user = this.store.selectSignal(AuthState.user);
  protected readonly userId = computed(() => this.user()?.id ?? null);

  protected readonly profile = toSignal(
    toObservable(this.userId).pipe(
      switchMap((userId) => {
        if (!userId) return of(null);
        return this.profileService.getUserProfile(userId).pipe(
          map((response) => response.data as UserInterface | null),
          catchError(() => of(null))
        );
      })
    ),
    { initialValue: null as UserInterface | null }
  );

  protected readonly userFullName = computed(() => {
    const profile = this.profile();
    if (profile) {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      if (fullName) return fullName;
    }
    return 'Mentor';
  });

  protected readonly userEmail = computed(() => {
    return this.profile()?.email?.trim() || 'No email available';
  });

  protected readonly userAvatarUrl = computed(() => {
    const avatarAttachments = this.profile()?.avatarAttachments as | { publicUrl?: string }[] | undefined;
    return avatarAttachments?.[0]?.publicUrl || 'assets/img/no_profile_avatar.png';
  });

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.closeAllDropdowns());
  }

  private closeAllDropdowns(): void {
    const dropdowns = [
      { panel: 'dropdownNotification', button: 'dropdownNotificationButton' },
      { panel: 'dropdown-user', button: null },
    ];

    dropdowns.forEach(({ panel, button }) => {
      const panelEl = document.getElementById(panel);
      panelEl?.classList.add('hidden');
      panelEl?.removeAttribute('style');

      if (button) {
        document.getElementById(button)?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }
}