import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';

import { AuthState } from '../../../store/auth/auth.state';
// import { SessionBookingCard } from '../../shared/session-booking-card/session-booking-card';
import { BookingService } from '../../../services/booking.service';
import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { of, switchMap } from 'rxjs';
import { MentorService } from '../../../services/mentor.service';
import { CommonModule } from '@angular/common';
import { MentorSearchItemInterface } from '@gurokonekt/models/interfaces/search/search.model';
// import { SessionHistoryCard } from '../../shared/session-history-card/session-history-card';
import { RecommendedMentorCard } from '../../shared/recommended-mentor-card/recommended-mentor-card';
import { GreetingCard } from '../../shared/greeting-card/greeting-card';
import { SectionCard } from '../../shared/section-card/section-card';
import { SectionTitle } from '../../shared/section-title/section-title';
import { ViewAllButton } from '../../shared/view-all-button/view-all-button';
// import { UserProfileCard } from '../../shared/user-profile-card/user-profile-card';
import { MentorSearch } from '../../shared/mentor-search/mentor-search';
import { IconComponent } from '../../shared/icon/icon.component';
import { MentorCardSkeleton } from '../../shared/mentor-card-skeleton/mentor-card-skeleton';
import { BookingCard } from '../../shared/booking-card/booking-card';
import { CompletedBookingCard } from '../../completed-booking-card/completed-booking-card';

@Component({
  selector: 'app-mentee-dashboard',
  imports: [
    SectionCard,
    GreetingCard,
    // SessionBookingCard,
    CommonModule,
    // SessionHistoryCard,
    RecommendedMentorCard,
    SectionTitle,
    ViewAllButton,
    MentorSearch,
    IconComponent,
    MentorCardSkeleton,
    BookingCard,
    CompletedBookingCard
  ],
  templateUrl: './mentee-dashboard.html',
  styleUrl: './mentee-dashboard.scss',
})
export class MenteeDashboard {
  private readonly store = inject(Store);
  protected readonly authUser = this.store.selectSignal(AuthState.user);
  protected readonly userId = computed(() => this.authUser()?.id);

  private readonly bookingService = inject(BookingService);
  private readonly mentorService = inject(MentorService);

  protected readonly fullName = computed<string>(() => {
    const value = this.authUser()?.['fullName'];
    return typeof value === 'string' && value.trim() ? value : 'Mentee';
  });

  protected readonly currentMentorSlide = signal(0);

  //FETCH BOOKINGS

  protected readonly upcomingSessions = toSignal<BookingCardInterface[] | null>(
   toObservable(this.userId).pipe(
    switchMap((userId) => {
      if (!userId) {
        return of([]);
      }

      return this.bookingService.getBookingsByStatuses(userId, [
        BookingStatus.PENDING,
        BookingStatus.APPROVED,
      ]);

    }),
   ),
   { initialValue: null }
  );
  protected readonly upcomingSessionLoading = computed(() => {
    return this.upcomingSessions() === null;
  });
  protected readonly upcomingSessionsCount = computed(
    () => this.upcomingSessions()?.length ?? 0
  );


  // FETCH COMPLETED SESSIONS
  protected readonly completedSessionsCount = computed(
    () => this.completedSessions()?.length ?? 0
  );
  protected readonly completedSessionLoading = computed(() => {
    return this.completedSessions() === null;
  });
  protected readonly completedSessions = toSignal<BookingCardInterface [] | null>(
   toObservable(this.userId).pipe(
    switchMap((userId) => {
      if (!userId) {
        return of([]);
      }
      return this.bookingService.getBookingsByStatuses(userId, [
        BookingStatus.COMPLETED,
      ]);
    }),
   ),
   { initialValue: null }
  );



  //RECOMMENDED MENTORS
  protected readonly recommendedMentors = toSignal<MentorSearchItemInterface[] | null>(
    this.mentorService.getRecommendedMentors(6),
    { initialValue: null }
  );
  protected readonly recommendedMentorsLoading = computed(
    () => this.recommendedMentors() === null
  );










  // CAROUSEL SLIDER FUNCTIONS
  protected nextMentorSlide(totalSlides: number): void {
    if (totalSlides <= 0) {
      return;
    }

    this.currentMentorSlide.update((currentSlide) =>
      currentSlide >= totalSlides ? 0 : currentSlide + 1
    );
  }

  protected previousMentorSlide(totalSlides: number): void {
    if (totalSlides <= 0) {
      return;
    }

    this.currentMentorSlide.update((currentSlide) =>
      currentSlide === 0 ? totalSlides : currentSlide - 1
    );
  }

  protected setMentorSlide(index: number): void {
    this.currentMentorSlide.set(index);
  }

  protected getMaxMentorSlide(totalMentors: number): number {
    return Math.max(totalMentors - 3, 0);
  }

  protected getMentorSlideIndexes(totalMentors: number): number[] {
    return Array.from(
      { length: this.getMaxMentorSlide(totalMentors) + 1 },
      (_, index) => index
    );
  }

}
