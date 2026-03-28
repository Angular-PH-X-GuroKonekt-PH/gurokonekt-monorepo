import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionBookingCard } from './session-booking-card';

describe('SessionBookingCard', () => {
  let component: SessionBookingCard;
  let fixture: ComponentFixture<SessionBookingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionBookingCard],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionBookingCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
