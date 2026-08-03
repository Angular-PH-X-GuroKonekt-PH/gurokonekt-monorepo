import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { FeaturedMentors } from './featured-mentors';
import { APP_CONFIG } from '../../../../environments/app-config.token';
import { EnvironmentModel } from '../../../../environments/environment.model';

const API_URL = 'https://test-api.example.com/api';
const FEATURED_URL = `${API_URL}/public/mentors/featured`;

const testConfig = {
  CONTENTFUL_SPACE: 'space',
  CONTENTFUL_ACCESS_TOKEN: 'token',
  CONTENTFUL_EVENTS: 'events',
  SIGN_IN_URL: 'https://example.com/login',
  REGISTER_URL: 'https://example.com/login',
  API_URL,
} satisfies EnvironmentModel;

const buildMentor = (id: string) => ({
  id,
  firstName: 'Maria',
  lastName: 'Santos',
  title: 'Senior Software Engineer',
  bio: 'Ten years building distributed systems.',
  areasOfExpertise: ['Software Engineering'],
  skills: ['TypeScript'],
  avatarUrl: 'https://cdn.test/avatar.png',
  averageRating: 4.8,
  ratingCount: 12,
});

describe('FeaturedMentors', () => {
  let service: FeaturedMentors;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: testConfig },
      ],
    });

    service = TestBed.inject(FeaturedMentors);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests two mentors by default', () => {
    service.getFeaturedMentors().subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === FEATURED_URL && r.params.get('limit') === '2',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('honours an explicit limit', () => {
    service.getFeaturedMentors(5).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === FEATURED_URL && r.params.get('limit') === '5',
    );
    req.flush({ data: [] });
  });

  it('unwraps the ResponseDto envelope', () => {
    const mentors = [buildMentor('a'), buildMentor('b')];
    let result: unknown;

    service.getFeaturedMentors().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url === FEATURED_URL).flush({
      status: 'success',
      statusCode: 200,
      message: 'Featured mentors retrieved successfully',
      data: mentors,
    });

    expect(result).toEqual(mentors);
  });

  it('emits an empty array when the request fails', () => {
    let result: unknown = 'untouched';
    let errored = false;

    service.getFeaturedMentors().subscribe({
      next: (r) => (result = r),
      error: () => (errored = true),
    });

    httpMock
      .expectOne((r) => r.url === FEATURED_URL)
      .flush('boom', { status: 500, statusText: 'Server Error' });

    // The hero has no error branch — a failure must look like "no mentors".
    expect(result).toEqual([]);
    expect(errored).toBe(false);
  });

  it('emits an empty array on a network error', () => {
    let result: unknown = 'untouched';

    service.getFeaturedMentors().subscribe((r) => (result = r));

    httpMock
      .expectOne((r) => r.url === FEATURED_URL)
      .error(new ProgressEvent('network error'));

    expect(result).toEqual([]);
  });

  it('emits an empty array when data is missing', () => {
    let result: unknown = 'untouched';

    service.getFeaturedMentors().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url === FEATURED_URL).flush({ status: 'success' });

    expect(result).toEqual([]);
  });

  it('emits an empty array when data is null', () => {
    let result: unknown = 'untouched';

    service.getFeaturedMentors().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url === FEATURED_URL).flush({ data: null });

    expect(result).toEqual([]);
  });
});
