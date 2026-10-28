import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { afterEach, vi } from 'vitest';

import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingService } from '../../../../shared/services/booking.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { MenteeBookingsTable } from './mentee-bookings-table';

describe('MenteeBookingsTable linked booking', () => {
  afterEach(() => vi.useRealTimers());

  it('shows a loading drawer for 600 ms before opening the linked booking', async () => {
    vi.useFakeTimers();
    const booking = createBooking();
    const bookingService = {
      getBookingById: vi.fn(() => of(booking)),
    };

    TestBed.configureTestingModule({
      imports: [MenteeBookingsTable],
      providers: [
        { provide: BookingService, useValue: bookingService },
        {
          provide: ToastService,
          useValue: { error: vi.fn(), success: vi.fn() },
        },
      ],
    });

    const fixture = TestBed.createComponent(MenteeBookingsTable);
    fixture.componentRef.setInput('bookings', []);
    fixture.componentRef.setInput('initialBookingId', booking.id);
    fixture.detectChanges();

    expect(bookingService.getBookingById).toHaveBeenCalledWith(booking.id);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'app-mentee-booking-details-modal',
      ),
    ).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-booking-details-loading]',
      ),
    ).toBeTruthy();

    await vi.advanceTimersByTimeAsync(599);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-booking-details-loading]',
      ),
    ).toBeTruthy();

    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'app-mentee-booking-details-modal',
      ),
    ).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-booking-details-loading]',
      ),
    ).toBeNull();
  });

  it('hides the previous drawer while a different linked booking loads', async () => {
    vi.useFakeTimers();
    const firstResult = new Subject<BookingCardInterface | null>();
    const secondResult = new Subject<BookingCardInterface | null>();
    const bookingService = {
      getBookingById: vi.fn((id: string) =>
        id === 'booking-1' ? firstResult : secondResult,
      ),
    };

    TestBed.configureTestingModule({
      imports: [MenteeBookingsTable],
      providers: [
        { provide: BookingService, useValue: bookingService },
        {
          provide: ToastService,
          useValue: { error: vi.fn(), success: vi.fn() },
        },
      ],
    });

    const fixture = TestBed.createComponent(MenteeBookingsTable);
    fixture.componentRef.setInput('bookings', []);
    fixture.componentRef.setInput('initialBookingId', 'booking-1');
    fixture.detectChanges();
    firstResult.next({ ...createBooking(), id: 'booking-1' });
    firstResult.complete();
    await vi.advanceTimersByTimeAsync(600);
    fixture.detectChanges();

    fixture.componentRef.setInput('initialBookingId', 'booking-2');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'app-mentee-booking-details-modal',
      ),
    ).toBeNull();
  });

  it('shows the loading drawer before opening table View details', async () => {
    vi.useFakeTimers();
    const booking = createBooking();

    TestBed.configureTestingModule({
      imports: [MenteeBookingsTable],
      providers: [
        { provide: BookingService, useValue: { getBookingById: vi.fn() } },
        {
          provide: ToastService,
          useValue: { error: vi.fn(), success: vi.fn() },
        },
      ],
    });

    const fixture = TestBed.createComponent(MenteeBookingsTable);
    fixture.componentRef.setInput('bookings', [booking]);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      viewDetails(value: BookingCardInterface): void;
    };
    component.viewDetails(booking);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-booking-details-loading]',
      ),
    ).toBeTruthy();

    await vi.advanceTimersByTimeAsync(600);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'app-mentee-booking-details-modal',
      ),
    ).toBeTruthy();
  });
});

function createBooking(): BookingCardInterface {
  return {
    id: 'booking-42',
    menteeId: 'mentee-1',
    mentorId: 'mentor-1',
    sessionDateTime: new Date('2026-11-02T22:00:00.000Z'),
    status: BookingStatus.PENDING,
    isDeleted: false,
    createdAt: new Date('2026-10-24T14:00:00.000Z'),
    updatedAt: new Date('2026-10-24T14:00:00.000Z'),
  };
}
