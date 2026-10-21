import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

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

  it('preserves the API message when a booking update is rejected', async () => {
    const result = firstValueFrom(
      service.updateBooking('booking-1', {
        sessionDateTime: '2026-10-22T09:00:00.000Z',
      }),
    );
    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/booking/booking-1'),
    );

    request.flush(
      {
        status: 'error',
        statusCode: 400,
        message:
          "The selected date and time are outside the mentor's availability. Please choose an available time.",
        data: null,
      },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(result).rejects.toMatchObject({
      statusCode: 400,
      message:
        "The selected date and time are outside the mentor's availability. Please choose an available time.",
    });
  });
});
