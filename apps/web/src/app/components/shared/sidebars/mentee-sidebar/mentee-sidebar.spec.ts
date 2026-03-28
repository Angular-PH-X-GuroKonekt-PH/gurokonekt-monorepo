import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';

import { MenteeSidebar } from './mentee-sidebar';

describe('MenteeSidebar', () => {
  let component: MenteeSidebar;
  let fixture: ComponentFixture<MenteeSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenteeSidebar],
      providers: [
        provideRouter([]),
        {
          provide: Store,
          useValue: {
            dispatch: jasmine.createSpy('dispatch'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MenteeSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
