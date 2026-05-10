import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

import { UserInterface } from '@gurokonekt/models';

import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ProfileService } from '../../../../core/profile/profile.service';
import { AuthState } from '../../../../core/auth/store/auth.state';


@Component({
  selector: 'app-mentor-navbar',
  imports: [RouterLink, CommonModule, IconComponent],
  templateUrl: './mentor-navbar.component.html',
})
export class MentorNavbar implements OnInit {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly isNotificationOpen = signal(false);
  protected readonly isUserMenuOpen = signal(false);

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

  protected toggleNotification(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationOpen.update((open) => !open);
    this.isUserMenuOpen.set(false);
  }

  protected toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserMenuOpen.update((open) => !open);
    this.isNotificationOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeAllDropdowns();
    }
  }

  private closeAllDropdowns(): void {
    this.isNotificationOpen.set(false);
    this.isUserMenuOpen.set(false);
  }

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }
}
