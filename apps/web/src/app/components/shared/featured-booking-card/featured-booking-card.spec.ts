import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturedBookingCard } from './featured-booking-card';

describe('FeaturedBookingCard', () => {
  let component: FeaturedBookingCard;
  let fixture: ComponentFixture<FeaturedBookingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedBookingCard],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedBookingCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
