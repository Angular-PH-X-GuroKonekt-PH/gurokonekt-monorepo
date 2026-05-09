import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { AuthState } from '../../../../core/auth/store/auth.state';
import { BookingService } from '../../../../shared/services/booking.service';
import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { of, switchMap } from 'rxjs';
import { MentorService } from '../../../mentor/services/mentor.service';
import { CommonModule } from '@angular/common';
import { MentorSearchItemInterface } from '@gurokonekt/models/interfaces/search/search.model';
import { MentorCardListSkeleton } from '../../../../shared/components/loaders/mentor-card-list-skeleton/mentor-card-list-skeleton';
import { BookingCardListSkeleton } from '../../../../shared/components/loaders/booking-card-list-skeleton/booking-card-list-skeleton';
import { GreetingCard } from 'apps/web/src/app/shared/components/greeting-card/greeting-card';
import { IconComponent } from 'apps/web/src/app/shared/components/icon/icon.component';
import { SectionCard } from 'apps/web/src/app/shared/components/section-card/section-card';
import { SectionTitle } from 'apps/web/src/app/shared/components/section-title/section-title';
import { ViewAllButton } from 'apps/web/src/app/shared/components/view-all-button/view-all-button';
import { RecommendedMentorCard } from '../../../mentor/components/recommended-mentor-card/recommended-mentor-card';
import { CompletedBookingCard } from '../../components/completed-booking-card/completed-booking-card';
import { SessionBookingCard } from '../../components/session-booking-card/session-booking-card';

@Component({
  selector: 'app-mentee-dashboard-page',
  imports: [
    SectionCard,
    GreetingCard,
    CommonModule,
    RecommendedMentorCard,
    SectionTitle,
    ViewAllButton,
    IconComponent,
    MentorCardListSkeleton,
    BookingCardListSkeleton,
    SessionBookingCard,
    CompletedBookingCard
  ],
  templateUrl: './mentee-dashboard.html',
  styleUrl: './mentee-dashboard.scss',
})
export class MenteeDashboardPage {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
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
    () => this.completedSessionHistory().length
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
  protected readonly completedSessionHistory = computed(() =>
    [...(this.completedSessions() ?? [])]
      .sort(
        (a, b) =>
          b.sessionDateTime.getTime() - a.sessionDateTime.getTime()
      )
      .slice(0, 5)
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

  protected onViewDetails(booking: BookingCardInterface): void {
    void this.router.navigate(['/mentee/booking-overview'], {
      queryParams: { bookingId: booking.id },
    });
  }

  protected onCancelRequest(booking: BookingCardInterface): void {
    void this.router.navigate(['/mentee/booking-overview'], {
      queryParams: { bookingId: booking.id, action: 'cancel' },
    });
  }

  protected onAddReview(booking: BookingCardInterface): void {
    void this.router.navigate(['/mentee/booking-overview'], {
      queryParams: { bookingId: booking.id, action: 'review' },
    });
  }

}
