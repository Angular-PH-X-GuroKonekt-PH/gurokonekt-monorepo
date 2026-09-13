import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MentorDashboardInterface } from '@gurokonekt/models';

import { MentorDashboardService } from './mentor-dashboard.service';

describe('MentorDashboardService', () => {
  let service: MentorDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MentorDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the authenticated mentor dashboard data', () => {
    const dashboard: MentorDashboardInterface = {
      greeting: 'Welcome back, Maria!',
      quickStats: {
        pendingBookingRequestsCount: 2,
        upcomingSessions: 0,
        totalCompletedSessions: 3,
      },
      nextUpcomingSession: null,
      shortcuts: [],
      navItems: [],
    };
    let result: MentorDashboardInterface | undefined;

    service.getDashboard('mentor-1').subscribe((value) => (result = value));

    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/user/mentor-1/dashboard'),
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      statusCode: 200,
      message: 'Dashboard retrieved',
      data: dashboard,
    });

    expect(result).toEqual(dashboard);
  });
});
