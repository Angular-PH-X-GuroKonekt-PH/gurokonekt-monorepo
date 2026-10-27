import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { CancelBookingModal } from '../../../mentee/components/mentee-bookings-table/cancel-booking-modal/cancel-booking-modal';
import { MenteeReviewModal } from '../../../mentee/components/mentee-bookings-table/mentee-review-modal/mentee-review-modal';
import { ApproveBookingModal } from './approve-booking-modal/approve-booking-modal';
import { MentorCancelBookingModal } from './cancel-booking-modal/cancel-booking-modal';
import { RejectBookingModal } from './reject-booking-modal/reject-booking-modal';
import { UpdateBookingModal } from './update-booking-modal/update-booking-modal';

describe('booking action modal layout', () => {
  const booking: BookingCardInterface = {
    id: 'booking-1',
    menteeId: 'mentee-1',
    mentorId: 'mentor-1',
    sessionDateTime: new Date('2026-11-02T00:00:00Z'),
    status: BookingStatus.PENDING,
    isDeleted: false,
    createdAt: new Date('2026-10-20T00:00:00Z'),
    updatedAt: new Date('2026-10-20T00:00:00Z'),
    mentor: {
      id: 'mentor-1',
      firstName: 'Joy',
      lastName: 'Dimaculangan',
      avatarAttachments: [],
    },
  };

  const modalComponents: Type<unknown>[] = [
    ApproveBookingModal,
    UpdateBookingModal,
    RejectBookingModal,
    MentorCancelBookingModal,
    CancelBookingModal,
    MenteeReviewModal,
  ];

  function render(component: Type<unknown>): ComponentFixture<unknown> {
    const fixture = TestBed.createComponent(component);
    fixture.componentRef.setInput('booking', booking);
    fixture.detectChanges();
    return fixture;
  }

  it.each(modalComponents)(
    '%s uses the admin modal shell and equal-width footer actions',
    (component) => {
      const fixture = render(component);
      const element = fixture.nativeElement as HTMLElement;
      const panel = element.querySelector<HTMLElement>(
        '[data-booking-action-modal]',
      );
      const body = element.querySelector<HTMLElement>('[data-modal-body]');
      const footer = element.querySelector<HTMLElement>('[data-modal-footer]');
      const actions = footer?.querySelectorAll<HTMLElement>('button');

      expect(panel?.classList.contains('max-w-md')).toBe(true);
      expect(panel?.classList.contains('rounded-2xl')).toBe(true);
      expect(body?.classList.contains('px-6')).toBe(true);
      expect(body?.classList.contains('overflow-y-auto')).toBe(true);
      expect(footer?.classList.contains('px-6')).toBe(true);
      expect(actions).toHaveLength(2);
      expect(
        Array.from(actions ?? []).every((button) =>
          button.classList.contains('flex-1'),
        ),
      ).toBe(true);
    },
  );
});
