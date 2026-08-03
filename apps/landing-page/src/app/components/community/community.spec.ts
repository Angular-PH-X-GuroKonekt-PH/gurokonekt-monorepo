import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Community } from './community';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { environment } from '../../../environments/environment';

describe('Community', () => {
  let component: Community;
  let fixture: ComponentFixture<Community>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Community],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Community);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
