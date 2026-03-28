import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionBookingButtons } from './session-booking-buttons';

describe('SessionBookingButtons', () => {
  let component: SessionBookingButtons;
  let fixture: ComponentFixture<SessionBookingButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionBookingButtons],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionBookingButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
