import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompletedBookingCard } from './completed-booking-card';

describe('CompletedBookingCard', () => {
  let component: CompletedBookingCard;
  let fixture: ComponentFixture<CompletedBookingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletedBookingCard],
    }).compileComponents();

    fixture = TestBed.createComponent(CompletedBookingCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
