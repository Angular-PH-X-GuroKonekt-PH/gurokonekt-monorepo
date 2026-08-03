import { TestBed } from '@angular/core/testing';

import { Contentful } from './contentful';
import { APP_CONFIG } from '../../../../environments/app-config.token';
import { environment } from '../../../../environments/environment';

describe('Contentful', () => {
  let service: Contentful;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: environment }],
    });
    service = TestBed.inject(Contentful);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
