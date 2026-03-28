import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileSettings } from './profile-settings';

describe('ProfileSettings', () => {
  let component: ProfileSettings;
  let fixture: ComponentFixture<ProfileSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
