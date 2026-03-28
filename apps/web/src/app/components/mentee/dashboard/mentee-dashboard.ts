import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';

import * as AuthActions from '../../../store/auth/auth.actions';
import { AuthState } from '../../../store/auth/auth.state';
import { SessionBookingCard } from '../../shared/session-booking-card/session-booking-card';
import { BookingService } from '../../../services/booking.service';
import {
  BookingSessionCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { map, Observable, of, switchMap } from 'rxjs';
import { MentorService } from '../../../services/mentor.service';
import { CommonModule } from '@angular/common';
import { MentorProfileInterface, UserInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { SessionHistoryCard } from '../../shared/session-history-card/session-history-card';
import { RecommendedMentorCard } from '../../shared/recommended-mentor-card/recommended-mentor-card';
import { GreetingCard } from '../../shared/greeting-card/greeting-card';
import { SectionCard } from '../../shared/section-card/section-card';
import { SectionTitle } from '../../shared/section-title/section-title';
import { ViewAllButton } from '../../shared/view-all-button/view-all-button';
import { ProfileService } from '../../../services/profile.service';
import { UserProfileCard } from '../../shared/user-profile-card/user-profile-card';

@Component({
  selector: 'app-mentee-dashboard',
  imports: [
    SectionCard,
    GreetingCard,
    SessionBookingCard,
    CommonModule,
    SessionHistoryCard,
    RecommendedMentorCard,
    SectionTitle,
    ViewAllButton,
    UserProfileCard
  ],
  templateUrl: './mentee-dashboard.html',
  styleUrl: './mentee-dashboard.scss',
})
export class MenteeDashboard {
  private readonly store = inject(Store);
  protected readonly authUser = this.store.selectSignal(AuthState.user);
  private readonly profileService = inject(ProfileService);

  private bookingService = inject(BookingService);
  private mentorService = inject(MentorService);
  public $bookingStatus = BookingStatus;

  protected readonly userId = computed(() => this.authUser()?.id ?? null);

  userProfile$: Observable<UserInterface | null> = of(this.authUser()).pipe(
    switchMap((user) => {
      const userId = user?.['id'];
      if (!userId) {
        return of(null);
      }

      return this.profileService.getUserProfile(userId).pipe(
        map((response) => response.data as UserInterface | null)
      );
    })
  );


  upcomingSessions$: Observable<BookingSessionCardInterface[]> =
    this.bookingService.getUpcomingSessions( this.userId() ?? '');


  completedSessions$: Observable<BookingSessionCardInterface[]> =
    this.bookingService.getBookingsByStatus(this.userId() ?? '', BookingStatus.COMPLETED);

  recommendedMentors$: Observable<MentorProfileInterface[]> =
    this.mentorService.getAllMentorProfiles();

  upcomingSessionsCount$: Observable<number> = this.upcomingSessions$.pipe(
    map((sessions) => sessions.length)
  );

  completedSessionsCount$: Observable<number> = this.completedSessions$.pipe(
    map((sessions) => sessions.length)
  );

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }
}
