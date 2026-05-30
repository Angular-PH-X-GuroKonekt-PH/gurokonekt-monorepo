import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { firstValueFrom, map, switchMap } from 'rxjs';

import { APP_ROUTES } from '../../../../shared/constants/routes';
import { BookingService } from '../../../../shared/services/booking.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { MentorService } from '../../../mentor/services/mentor.service';
import { MenteePageLoader } from '../../components/mentee-page-loader/mentee-page-loader';
import { MentorProfileHero } from '../../components/mentor-profile-hero/mentor-profile-hero';
import {
  BookSessionDateOption,
  BookSessionSlotOption,
} from '../../interfaces/book-session.interface';
import {
  addDays,
  buildAvailableBookingDates,
  buildBookingDateTimeForApi,
  buildDisplayDateTime,
  BOOKING_DATE_RANGE_DAYS,
  getDateKey,
} from '../../utils/book-session-date.util';
import { formatTimeTo12Hour } from '../../utils/mentor-availability.util';

@Component({
  selector: 'app-mentee-book-session-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    IconComponent,
    MenteePageLoader,
    MentorProfileHero,
  ],
  templateUrl: './mentee-book-session.page.html',
  styleUrl: './mentee-book-session.page.css',
})
export class MenteeBookSessionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mentorService = inject(MentorService);
  private readonly bookingService = inject(BookingService);
  private readonly notificationService = inject(NotificationService);
  private readonly toastService = inject(ToastService);

  protected readonly mentorProfileRoute = APP_ROUTES.MENTOR_PROFILE;
  protected readonly bookingOverviewRoute = APP_ROUTES.BOOKING_OVERVIEW;

  // Form state
  protected readonly selectedDate = signal<BookSessionDateOption | null>(null);
  protected readonly selectedSlot = signal<BookSessionSlotOption | null>(null);
  protected readonly bookingNote = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // Route-driven mentor data
  protected readonly mentorId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('mentorId') ?? '')),
    { initialValue: '' }
  );

  protected readonly mentor = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('mentorId') ?? ''),
      switchMap((mentorId) => this.mentorService.getMentorProfileById(mentorId))
    ),
    { initialValue: null }
  );

  protected readonly mentorFullName = computed(() => {
    const mentor = this.mentor();

    if (!mentor) {
      return 'Mentor';
    }

    return [mentor.user.firstName, mentor.user.lastName]
      .filter(Boolean)
      .join(' ');
  });

  // Calendar state
  protected readonly availableDates = computed(() =>
    buildAvailableBookingDates(
      this.mentor()?.availability ?? [],
      BOOKING_DATE_RANGE_DAYS
    )
  );

  protected readonly availableDateMap = computed(
    () =>
      new Map(
        this.availableDates().map((date) => [getDateKey(date.date), date])
      )
  );

  protected readonly calendarOptions = computed<CalendarOptions>(() => {
    const availableDateMap = this.availableDateMap();
    const selectedDate = this.selectedDate();
    const selectedDateKey = selectedDate ? getDateKey(selectedDate.date) : null;

    return {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      height: 'auto',
      fixedWeekCount: false,
      showNonCurrentDates: false,
      headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next',
      },
      validRange: {
        start: getDateKey(new Date()),
        end: getDateKey(addDays(new Date(), BOOKING_DATE_RANGE_DAYS + 1)),
      },
      dateClick: (event) => this.selectCalendarDate(event),
      dayCellClassNames: (event) => {
        const dateKey = getDateKey(event.date);
        const classes = ['guro-calendar-day'];

        if (availableDateMap.has(dateKey)) {
          classes.push('guro-calendar-available');
        } else {
          classes.push('guro-calendar-disabled');
        }

        if (selectedDateKey === dateKey) {
          classes.push('guro-calendar-selected');
        }

        return classes;
      },
    };
  });

  // Time slots shown after a valid calendar date is selected
  protected readonly availableSlots = computed<BookSessionSlotOption[]>(() => {
    const selectedDate = this.selectedDate();

    if (!selectedDate) {
      return [];
    }

    return selectedDate.timeFrames.map((timeFrame) => {
      const bookingDateTime = buildBookingDateTimeForApi(
        selectedDate.date,
        timeFrame.from
      );

      return {
        label: `${formatTimeTo12Hour(timeFrame.from)} - ${formatTimeTo12Hour(
          timeFrame.to
        )}`,
        displayDateTime: buildDisplayDateTime(
          selectedDate.date,
          timeFrame.from
        ),
        bookingDateTime,
      };
    });
  });

  // User actions
  protected selectCalendarDate(event: DateClickArg): void {
    const date = this.availableDateMap().get(getDateKey(event.date));

    if (!date) {
      this.errorMessage.set('Please select an available booking date.');
      return;
    }

    this.setSelectedDate(date);
  }

  protected selectSlot(slot: BookSessionSlotOption): void {
    this.selectedSlot.set(slot);
    this.errorMessage.set(null);
  }

  protected updateBookingNote(note: string): void {
    this.bookingNote.set(note);
  }

  protected confirmBooking(): void {
    const mentorId = this.mentorId();
    const selectedSlot = this.selectedSlot();

    if (!mentorId || !selectedSlot) {
      this.errorMessage.set('Please select an available date and time slot.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.bookingService
      .createBooking({
        mentorId,
        sessionDateTime: selectedSlot.bookingDateTime,
        notes: this.bookingNote().trim() || undefined,
      })
      .subscribe({
        next: () => this.handleBookingSuccess(),
        error: (error: { message?: string }) => this.handleBookingError(error),
      });
  }

  // Internal state handlers
  private setSelectedDate(date: BookSessionDateOption): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    this.errorMessage.set(null);
  }

  private handleBookingSuccess(): void {
    this.isSubmitting.set(false);

    this.toastService.success(
      'Your booking request has been submitted and is pending mentor approval.',
      'Booking Request Sent'
    );

    this.refreshNotifications();

    void this.router.navigate(['/', this.bookingOverviewRoute]);
  }

  private handleBookingError(error: { message?: string }): void {
    this.isSubmitting.set(false);

    this.toastService.error(
      error.message || 'Unable to create booking request. Please try again.',
      'Booking Failed'
    );
  }

  private refreshNotifications(): void {
    void firstValueFrom(this.notificationService.getMyNotifications()).catch(
      () => undefined
    );
  }
}
