import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Inquiries } from './inquiries';
import { APP_CONFIG } from '../../../../environments/app-config.token';
import { EnvironmentModel } from '../../../../environments/environment.model';

const API_URL = 'https://test-api.example.com/api';

const testConfig = {
  CONTENTFUL_SPACE: 'space',
  CONTENTFUL_ACCESS_TOKEN: 'token',
  CONTENTFUL_EVENTS: 'events',
  SIGN_IN_URL: 'https://example.com/login',
  REGISTER_URL: 'https://example.com/login',
  API_URL,
  RECAPTCHA_SITE_KEY: 'site-key',
} satisfies EnvironmentModel;

const PAYLOAD = {
  email: 'maria@example.com',
  fullName: 'Maria Santos',
  topic: 'Becoming a mentor',
  message: 'I would like to know how to apply as a mentor.',
  recaptchaToken: 'token-abc',
};

describe('Inquiries', () => {
  let service: Inquiries;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: testConfig },
      ],
    });
    service = TestBed.inject(Inquiries);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts the payload to the public inquiries endpoint', () => {
    service.submit(PAYLOAD).subscribe();

    const req = httpMock.expectOne(`${API_URL}/public/inquiries`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(PAYLOAD);
    req.flush({ data: { id: 'i1', createdAt: 'now' } });
  });

  // The form needs the status code to choose a message, so unlike the
  // featured-mentors service this must NOT swallow errors.
  it('propagates errors to the caller', () => {
    let status: number | undefined;

    service.submit(PAYLOAD).subscribe({
      next: () => fail('should not succeed'),
      error: (e) => (status = e.status),
    });

    httpMock
      .expectOne(`${API_URL}/public/inquiries`)
      .flush('nope', { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(400);
  });
});
