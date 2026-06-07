// force-cancel-booking-modal.spec.ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ForceCancelBookingModalComponent } from './force-cancel-booking-modal';
import { BookingListItem } from '../../../services/booking-management.service';

const mockBooking: BookingListItem = {
  id: 'booking-1',
  menteeId: 'mentee-1',
  mentorId: 'mentor-1',
  sessionDateTime: '2026-06-10T10:00:00Z',
  status: 'APPROVED',
  sessionLink: null,
  notes: null,
  cancelReason: null,
  isDeleted: false,
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  mentor: { id: 'mentor-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  mentee: { id: 'mentee-1', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
};

describe('ForceCancelBookingModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForceCancelBookingModalComponent],
    }).compileComponents();
  });

  function createComponent(booking = mockBooking, submitting = false) {
    const fixture = TestBed.createComponent(ForceCancelBookingModalComponent);
    fixture.componentRef.setInput('booking', booking);
    fixture.componentRef.setInput('submitting', submitting);
    fixture.detectChanges();
    return fixture;
  }

  it('creates the component', () => {
    expect(createComponent().componentInstance).toBeTruthy();
  });

  it('isValid is false when reason is fewer than 10 characters', () => {
    const instance = createComponent().componentInstance as any;
    instance.reason.set('short');
    expect(instance.isValid).toBe(false);
  });

  it('isValid is true when reason is 10 or more characters', () => {
    const instance = createComponent().componentInstance as any;
    instance.reason.set('long enough reason here');
    expect(instance.isValid).toBe(true);
  });

  it('onConfirm sets touched and does not emit when reason is invalid', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance as any;
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    instance.reason.set('short');
    instance.onConfirm();
    expect(instance.touched()).toBe(true);
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('onConfirm emits trimmed reason when valid', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance as any;
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    instance.reason.set('  valid reason for cancellation  ');
    instance.onConfirm();
    expect(confirmed).toHaveBeenCalledWith('valid reason for cancellation');
  });

  it('close resets state and emits closed', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance as any;
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    instance.reason.set('some reason text');
    instance.touched.set(true);
    instance.close();
    expect(instance.reason()).toBe('');
    expect(instance.touched()).toBe(false);
    expect(closed).toHaveBeenCalled();
  });
});
