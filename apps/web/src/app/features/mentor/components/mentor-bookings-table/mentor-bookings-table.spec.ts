import { TestBed } from '@angular/core/testing';
import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { throwError } from 'rxjs';

import { BookingService } from '../../../../shared/services/booking.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { MentorBookingsTable } from './mentor-bookings-table';

describe('MentorBookingsTable', () => {
  it('shows the API message and keeps the update modal open when rescheduling fails', () => {
    const message =
      "The selected date and time are outside the mentor's availability. Please choose an available time.";
    const booking = {
      id: 'booking-1',
      menteeId: 'mentee-1',
      mentorId: 'mentor-1',
      sessionDateTime: new Date('2030-01-01T09:00:00.000Z'),
      status: BookingStatus.APPROVED,
      isDeleted: false,
      createdAt: new Date('2029-12-01T00:00:00.000Z'),
      updatedAt: new Date('2029-12-01T00:00:00.000Z'),
    } satisfies BookingCardInterface;

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        {
          provide: BookingService,
          useValue: {
            updateBooking: () => throwError(() => ({ message })),
          },
        },
      ],
    });
    const component = TestBed.runInInjectionContext(
      () => new MentorBookingsTable(),
    );
    const toastService = TestBed.inject(ToastService);
    component.updateBookingTarget.set(booking);
    component.updateSessionDate.set('2030-01-02');
    component.updateSessionTime.set('09:00');

    component.confirmUpdateBooking();

    expect(toastService.toasts$()[0]?.message).toBe(message);
    expect(component.updateBookingTarget()).toBe(booking);
  });
});
