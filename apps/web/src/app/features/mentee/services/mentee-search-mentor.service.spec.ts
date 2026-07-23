import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { MentorRecommendationResultInterface } from '@gurokonekt/models/interfaces/search/search.model';
import { MenteeSearchMentorService } from './mentee-search-mentor.service';

describe('MenteeSearchMentorService', () => {
  let service: MenteeSearchMentorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MenteeSearchMentorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests recommendations with the given limit', () => {
    let result: MentorRecommendationResultInterface | undefined;
    service.getRecommendedMentors(6).subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) =>
      r.url.includes('/search/recommended'),
    );
    expect(req.request.params.get('limit')).toBe('6');

    req.flush({
      status: 'success',
      statusCode: 200,
      message: 'OK',
      data: { results: [], isPersonalized: true },
    });

    expect(result?.isPersonalized).toBe(true);
  });

  it('falls back to an empty non-personalized result when data is missing', () => {
    let result: MentorRecommendationResultInterface | undefined;
    service.getRecommendedMentors().subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) =>
      r.url.includes('/search/recommended'),
    );
    req.flush({
      status: 'success',
      statusCode: 200,
      message: 'OK',
      data: null,
    });

    expect(result).toEqual({ results: [], isPersonalized: false });
  });

  it('surfaces an error message when the request fails', () => {
    let error: Error | undefined;
    service.getRecommendedMentors().subscribe({ error: (e) => (error = e) });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/search/recommended'),
    );
    req.error(new ProgressEvent('error'));

    expect(error).toBeInstanceOf(Error);
  });
});
