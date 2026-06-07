// view-booking-detail-modal.spec.ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { ViewBookingDetailModalComponent } from './view-booking-detail-modal';
import { BookingManagementService, BookingListItem } from '../../../services/booking-management.service';

const mockBooking: BookingListItem = {
  id: 'booking-1',
  menteeId: 'mentee-1',
  mentorId: 'mentor-1',
  sessionDateTime: '2026-06-10T10:00:00Z',
  status: 'COMPLETED',
  sessionLink: null,
  notes: null,
  cancelReason: null,
  isDeleted: false,
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  mentor: { id: 'mentor-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  mentee: { id: 'mentee-1', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
};

const mockService = {
  getBookingById: vi.fn(() => of({ data: { ...mockBooking, feedback: [] } })),
};

describe('ViewBookingDetailModalComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ViewBookingDetailModalComponent],
      providers: [{ provide: BookingManagementService, useValue: mockService }],
    }).compileComponents();
  });

  function createComponent(booking = mockBooking) {
    const fixture = TestBed.createComponent(ViewBookingDetailModalComponent);
    fixture.componentRef.setInput('booking', booking);
    fixture.detectChanges();
    return fixture;
  }

  it('creates the component', () => {
    expect(createComponent().componentInstance).toBeTruthy();
  });

  it('calls getBookingById with the booking id on init', () => {
    createComponent();
    expect(mockService.getBookingById).toHaveBeenCalledWith('booking-1');
  });

  it('getStatusLabel returns Confirmed for APPROVED', () => {
    const instance = createComponent().componentInstance as any;
    expect(instance.getStatusLabel('APPROVED')).toBe('Confirmed');
  });

  it('getStatusLabel returns correct label for all statuses', () => {
    const instance = createComponent().componentInstance as any;
    expect(instance.getStatusLabel('PENDING')).toBe('Pending');
    expect(instance.getStatusLabel('COMPLETED')).toBe('Completed');
    expect(instance.getStatusLabel('CANCELLED')).toBe('Cancelled');
    expect(instance.getStatusLabel('REJECTED')).toBe('Rejected');
    expect(instance.getStatusLabel('DELETED')).toBe('Deleted');
  });

  it('close emits closed', () => {
    const fixture = createComponent();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    (fixture.componentInstance as any).close();
    expect(closed).toHaveBeenCalled();
  });
});
