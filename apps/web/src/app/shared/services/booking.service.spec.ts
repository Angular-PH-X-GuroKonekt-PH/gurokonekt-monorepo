import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { BookingStatus } from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches one related booking and converts its dates', async () => {
    const resultPromise = firstValueFrom(service.getBookingById('booking-42'));
    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/booking/booking-42'),
    );
    expect(request.request.method).toBe('GET');

    request.flush({
      status: 'success',
      statusCode: 200,
      message: 'Booking retrieved successfully',
      data: {
        id: 'booking-42',
        menteeId: 'mentee-1',
        mentorId: 'mentor-1',
        sessionDateTime: '2026-11-02T22:00:00.000Z',
        status: BookingStatus.PENDING,
        isDeleted: false,
        createdAt: '2026-10-24T14:00:00.000Z',
        updatedAt: '2026-10-24T14:00:00.000Z',
      },
    });

    const booking = await resultPromise;
    expect(booking?.id).toBe('booking-42');
    expect(booking?.sessionDateTime).toBeInstanceOf(Date);
    expect(booking?.createdAt).toBeInstanceOf(Date);
    expect(booking?.updatedAt).toBeInstanceOf(Date);
  });
});
