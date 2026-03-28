import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileCard } from './user-profile-card';

describe('UserProfileCard', () => {
  let component: UserProfileCard;
  let fixture: ComponentFixture<UserProfileCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileCard],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
