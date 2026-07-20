import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { APP_ROUTES } from '../../../../shared/constants/routes';
import { BookingService } from '../../../../shared/services/booking.service';
import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { of, switchMap } from 'rxjs';
import { MentorService } from '../../../mentor/services/mentor.service';
import { MentorSearchItemInterface } from '@gurokonekt/models/interfaces/search/search.model';
import { MentorCardListSkeleton } from '../../components/mentor-card-list-skeleton/mentor-card-list-skeleton.component';
import { GreetingCard } from '../../../../shared/components/greeting-card/greeting-card.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { MentorRecommendedCard } from '../../../mentor/components/mentor-recommended-card/mentor-recommended-card';
import { MenteeDashboardBookingWidget } from '../../components/mentee-dashboard-booking-widget/mentee-dashboard-booking-widget';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';

@Component({
  selector: 'app-mentee-dashboard-page',
  imports: [
    GreetingCard,
    MentorRecommendedCard,
    IconComponent,
    MentorCardListSkeleton,
    MenteeDashboardBookingWidget,
  ],
  templateUrl: './mentee-dashboard.page.html',
})
export class MenteeDashboardPage {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  protected readonly authUser = this.store.selectSignal(AuthSelectors.user);
  protected readonly userId = computed(() => this.authUser()?.id);

  private readonly bookingService = inject(BookingService);
  private readonly mentorService = inject(MentorService);

  protected readonly fullName = computed<string>(() => {
    const value = this.authUser()?.['fullName'];
    return typeof value === 'string' && value.trim() ? value : 'Mentee';
  });

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
    { initialValue: null },
  );
  protected readonly upcomingSessionLoading = computed(() => {
    return this.upcomingSessions() === null;
  });
  protected readonly upcomingSessionsCount = computed(
    () => this.upcomingSessions()?.length ?? 0,
  );
  protected readonly upcomingSessionPreview = computed(() =>
    [...(this.upcomingSessions() ?? [])]
      .sort((a, b) => a.sessionDateTime.getTime() - b.sessionDateTime.getTime())
      .slice(0, 3),
  );

  // FETCH COMPLETED SESSIONS
  protected readonly completedSessionsCount = computed(
    () => this.completedSessionHistory().length,
  );
  protected readonly completedSessionLoading = computed(() => {
    return this.completedSessions() === null;
  });
  protected readonly completedSessions = toSignal<
    BookingCardInterface[] | null
  >(
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
    { initialValue: null },
  );
  protected readonly completedSessionHistory = computed(() =>
    [...(this.completedSessions() ?? [])]
      .sort((a, b) => b.sessionDateTime.getTime() - a.sessionDateTime.getTime())
      .slice(0, 5),
  );

  //RECOMMENDED MENTORS
  protected readonly recommendedMentors = toSignal<
    MentorSearchItemInterface[] | null
  >(this.mentorService.getRecommendedMentors(6), { initialValue: null });
  protected readonly recommendedMentorsLoading = computed(
    () => this.recommendedMentors() === null,
  );
  protected readonly currentMentorSlide = signal(0);

  protected nextMentorSlide(maxSlide: number): void {
    this.currentMentorSlide.update((current) =>
      current >= maxSlide ? 0 : current + 1,
    );
  }

  protected previousMentorSlide(maxSlide: number): void {
    this.currentMentorSlide.update((current) =>
      current <= 0 ? maxSlide : current - 1,
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
      (_, index) => index,
    );
  }

  protected onViewDetails(booking: BookingCardInterface): void {
    void this.router.navigate([APP_ROUTES.BOOKING_OVERVIEW], {
      queryParams: { bookingId: booking.id },
    });
  }

  protected viewAllUpcomingSessions(): void {
    void this.router.navigate([APP_ROUTES.BOOKING_OVERVIEW]);
  }

  protected viewAllCompletedSessions(): void {
    void this.router.navigate([APP_ROUTES.BOOKING_OVERVIEW], {
      queryParams: { tab: 'Completed' },
    });
  }
}
