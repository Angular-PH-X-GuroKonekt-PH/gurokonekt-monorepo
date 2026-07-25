import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MenteeFindMentorsPage } from './mentee-find-mentors.page';

describe('MenteeFindMentorsPage', () => {
  const createComponent = (queryParams: Record<string, unknown>) => {
    TestBed.configureTestingModule({
      imports: [MenteeFindMentorsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of(queryParams),
            snapshot: { queryParams },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(MenteeFindMentorsPage);
    return fixture.componentInstance;
  };

  it('has no active filters when no query params are present', () => {
    const component = createComponent({});
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('has active filters when a filter query param is present', () => {
    const component = createComponent({ skills: 'javascript' });
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('does not treat an empty-string filter value as an active filter', () => {
    const component = createComponent({ name: '' });
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('does not treat a whitespace-only filter value as an active filter', () => {
    const component = createComponent({ language: '   ' });
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('does not treat the page param alone as an active filter', () => {
    const component = createComponent({ page: '2' });
    expect(component.hasActiveFilters()).toBe(false);
  });
});
