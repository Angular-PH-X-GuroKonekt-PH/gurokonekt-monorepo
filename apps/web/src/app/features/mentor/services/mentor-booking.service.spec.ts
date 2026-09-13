import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { BookingStatus, MentorDashboardInterface } from '@gurokonekt/models';
import { of } from 'rxjs';

import { BookingService } from '../../../shared/services/booking.service';
import { MentorBookingService } from './mentor-booking.service';
import { MentorDashboardService } from './mentor-dashboard.service';

describe('MentorBookingService dashboard data', () => {
  it('uses unpaginated dashboard stats instead of counting the booking page', () => {
    const authUser = signal({ id: 'mentor-1' });
    const dashboard: MentorDashboardInterface = {
      greeting: 'Welcome back, Maria!',
      quickStats: {
        pendingBookingRequestsCount: 0,
        upcomingSessions: 0,
        totalCompletedSessions: 3,
      },
      nextUpcomingSession: null,
      shortcuts: [],
      navItems: [],
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Store,
          useValue: { selectSignal: () => authUser },
        },
        {
          provide: BookingService,
          useValue: {
            getMentorBookings: () =>
              of({
                data: [
                  {
                    id: 'past-approved',
                    status: BookingStatus.APPROVED,
                    sessionDateTime: new Date('2026-09-01T00:00:00.000Z'),
                  },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              }),
          },
        },
        {
          provide: MentorDashboardService,
          useValue: { getDashboard: () => of(dashboard) },
        },
      ],
    });

    const service = TestBed.inject(MentorBookingService);
    TestBed.tick();

    expect(service.bookings()).toHaveLength(1);
    expect(service.upcomingSessions()).toBe(0);
    expect(service.totalCompleted()).toBe(3);
    expect(service.upcomingSession()).toBeNull();
  });
});
