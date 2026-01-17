import { TestBed } from '@angular/core/testing';

import { Contentful } from './contentful';

describe('Contentful', () => {
  let service: Contentful;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Contentful);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
