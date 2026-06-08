// booking-table.spec.ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { BookingTableComponent } from './booking-table';
import { BookingManagementService, BookingListItem } from '../../services/booking-management.service';

const mockPaginatedResponse = {
  data: { data: [], total: 0, totalPages: 0, page: 1, limit: 20 },
};

const mockService = {
  getBookings: vi.fn(() => of(mockPaginatedResponse)),
  getBookingById: vi.fn(() => of({ data: null })),
  forceCancelBooking: vi.fn(() => of({ data: null })),
};

const mockApprovedBooking: BookingListItem = {
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

describe('BookingTableComponent — filters and actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [BookingTableComponent],
      providers: [{ provide: BookingManagementService, useValue: mockService }],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(BookingTableComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('creates the component', () => {
    expect(createComponent().componentInstance).toBeTruthy();
  });

  it('onDateFromChange updates dateFrom signal, resets page, and reloads', () => {
    const instance = createComponent().componentInstance as any;
    instance.onDateFromChange('2026-06-01');
    expect(instance.dateFrom()).toBe('2026-06-01');
    expect(instance.page()).toBe(1);
    expect(mockService.getBookings).toHaveBeenCalledTimes(2); // init + change
  });

  it('onDateToChange updates dateTo signal, resets page, and reloads', () => {
    const instance = createComponent().componentInstance as any;
    instance.onDateToChange('2026-06-30');
    expect(instance.dateTo()).toBe('2026-06-30');
    expect(instance.page()).toBe(1);
    expect(mockService.getBookings).toHaveBeenCalledTimes(2);
  });

  it('toggleDropdown opens dropdown for a booking id', () => {
    const instance = createComponent().componentInstance as any;
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;
    instance.toggleDropdown('booking-1', fakeEvent);
    expect(instance.openDropdownId()).toBe('booking-1');
  });

  it('toggleDropdown closes dropdown when same id toggled again', () => {
    const instance = createComponent().componentInstance as any;
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;
    instance.toggleDropdown('booking-1', fakeEvent);
    instance.toggleDropdown('booking-1', fakeEvent);
    expect(instance.openDropdownId()).toBeNull();
  });

  it('openViewDetail sets selectedBooking, shows detail modal, and closes dropdown', () => {
    const instance = createComponent().componentInstance as any;
    instance.openDropdownId.set('booking-1');
    instance.openViewDetail(mockApprovedBooking);
    expect(instance.selectedBooking()).toEqual(mockApprovedBooking);
    expect(instance.showDetailModal()).toBe(true);
    expect(instance.openDropdownId()).toBeNull();
  });

  it('openForceCancel sets selectedBooking, shows force cancel modal, and closes dropdown', () => {
    const instance = createComponent().componentInstance as any;
    instance.openDropdownId.set('booking-1');
    instance.openForceCancel(mockApprovedBooking);
    expect(instance.selectedBooking()).toEqual(mockApprovedBooking);
    expect(instance.showForceCancelModal()).toBe(true);
    expect(instance.openDropdownId()).toBeNull();
  });

  it('closeDetailModal hides modal and clears selectedBooking', () => {
    const instance = createComponent().componentInstance as any;
    instance.selectedBooking.set(mockApprovedBooking);
    instance.showDetailModal.set(true);
    instance.closeDetailModal();
    expect(instance.showDetailModal()).toBe(false);
    expect(instance.selectedBooking()).toBeNull();
  });

  it('closeForceCancelModal hides modal and clears selectedBooking', () => {
    const instance = createComponent().componentInstance as any;
    instance.selectedBooking.set(mockApprovedBooking);
    instance.showForceCancelModal.set(true);
    instance.closeForceCancelModal();
    expect(instance.showForceCancelModal()).toBe(false);
    expect(instance.selectedBooking()).toBeNull();
  });

  it('onForceCancelConfirmed calls forceCancelBooking, closes modal, and reloads on success', () => {
    const instance = createComponent().componentInstance as any;
    instance.selectedBooking.set(mockApprovedBooking);
    instance.showForceCancelModal.set(true);
    const callsBefore = (mockService.getBookings as ReturnType<typeof vi.fn>).mock.calls.length;

    instance.onForceCancelConfirmed('a valid reason for cancellation');

    expect(mockService.forceCancelBooking).toHaveBeenCalledWith('booking-1', 'a valid reason for cancellation');
    expect(instance.showForceCancelModal()).toBe(false);
    expect(instance.selectedBooking()).toBeNull();
    expect((mockService.getBookings as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore + 1);
  });

  it('getStatusLabel maps APPROVED to Confirmed', () => {
    const instance = createComponent().componentInstance as any;
    expect(instance.getStatusLabel('APPROVED')).toBe('Confirmed');
  });
});
