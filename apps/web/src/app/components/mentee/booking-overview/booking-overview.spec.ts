import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingOverview } from './booking-overview';

describe('BookingOverview', () => {
  let component: BookingOverview;
  let fixture: ComponentFixture<BookingOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingOverview],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
