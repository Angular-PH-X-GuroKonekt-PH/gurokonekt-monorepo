import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingDetailsModal } from './booking-details-modal';

describe('BookingDetailsModal', () => {
  const booking: BookingCardInterface = {
    id: 'booking-1',
    menteeId: 'mentee-1',
    mentorId: 'mentor-1',
    sessionDateTime: new Date('2026-10-26T02:00:00Z'),
    status: BookingStatus.APPROVED,
    sessionLink: 'https://example.com/session',
    menteeNotes: 'Discuss TypeScript',
    mentorNotes: 'Review generics',
    isDeleted: false,
    createdAt: new Date('2026-10-20T02:00:00Z'),
    updatedAt: new Date('2026-10-20T02:00:00Z'),
    mentee: {
      id: 'mentee-1',
      firstName: 'Mina',
      lastName: 'Reyes',
      avatarAttachments: [],
    },
  };

  it('renders booking details as a right-side full-height drawer', () => {
    const fixture = TestBed.createComponent(BookingDetailsModal);
    fixture.componentRef.setInput('booking', booking);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const overlay = element.querySelector<HTMLElement>(
      '[data-booking-details-overlay]',
    );
    const panel = element.querySelector<HTMLElement>(
      '[data-booking-details-panel]',
    );

    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(overlay?.classList.contains('justify-end')).toBe(true);
    expect(panel?.classList.contains('h-full')).toBe(true);
    expect(panel?.classList.contains('max-w-lg')).toBe(true);
  });

  it('presents the session as one schedule summary with stacked notes', () => {
    const fixture = TestBed.createComponent(BookingDetailsModal);
    fixture.componentRef.setInput('booking', booking);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const schedule = element.querySelector<HTMLElement>(
      '[data-booking-schedule]',
    );
    const notes = element.querySelectorAll<HTMLElement>('[data-booking-note]');

    expect(schedule?.textContent).toContain('Schedule');
    expect(schedule?.textContent).toContain('Oct 26, 2026');
    expect(notes).toHaveLength(2);
    expect(notes[0].textContent).toContain('Mentee Notes');
    expect(notes[1].textContent).toContain('Mentor Notes');
  });

  it.each([
    [BookingStatus.APPROVED, 'bg-green-50', 'text-green-700'],
    [BookingStatus.PENDING, 'bg-yellow-50', 'text-yellow-700'],
    [BookingStatus.COMPLETED, 'bg-blue-50', 'text-blue-700'],
    [BookingStatus.CANCELLED, 'bg-red-50', 'text-red-700'],
    [BookingStatus.REJECTED, 'bg-red-50', 'text-red-700'],
  ])('uses the table color for %s status', (status, background, text) => {
    const fixture = TestBed.createComponent(BookingDetailsModal);
    fixture.componentRef.setInput('booking', { ...booking, status });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector(
      '[data-booking-status]',
    ) as HTMLElement;

    expect(badge.classList.contains(background)).toBe(true);
    expect(badge.classList.contains(text)).toBe(true);
  });

  it('closes from the overlay but not from a click inside the drawer', () => {
    const fixture = TestBed.createComponent(BookingDetailsModal);
    fixture.componentRef.setInput('booking', booking);
    const closeSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closeSpy);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const overlay = element.querySelector<HTMLElement>(
      '[data-booking-details-overlay]',
    );
    const panel = element.querySelector<HTMLElement>(
      '[data-booking-details-panel]',
    );

    panel?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closeSpy).not.toHaveBeenCalled();

    overlay?.click();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('closes when Escape is pressed', () => {
    const fixture = TestBed.createComponent(BookingDetailsModal);
    fixture.componentRef.setInput('booking', booking);
    const closeSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closeSpy);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closeSpy).toHaveBeenCalledOnce();
  });
});
