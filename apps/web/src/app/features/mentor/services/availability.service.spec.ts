import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AvailabilityService } from './availability.service';
import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AvailabilityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('maps API response to { availabilities, sessionDurationMinutes }', () => {
    const mockData = {
      availability: [{ day: DaysInWeek.Monday, timeFrames: [{ from: '09:00', to: '17:00' }] }],
      sessionDurationMinutes: 60,
    };

    let result: { availabilities: typeof mockData.availability; sessionDurationMinutes: number } | undefined;
    service.getAvailability('user-1').subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.url.includes('/user/user-1/availability'));
    req.flush({ status: 'success', statusCode: 200, message: 'OK', data: mockData });

    expect(result?.availabilities).toEqual(mockData.availability);
    expect(result?.sessionDurationMinutes).toBe(60);
  });

  it('returns empty fallback on HTTP error', () => {
    let result: { availabilities: unknown[]; sessionDurationMinutes: number } | undefined;
    service.getAvailability('user-1').subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.url.includes('/user/user-1/availability'));
    req.error(new ProgressEvent('error'));

    expect(result?.availabilities).toEqual([]);
    expect(result?.sessionDurationMinutes).toBe(60);
  });
});
