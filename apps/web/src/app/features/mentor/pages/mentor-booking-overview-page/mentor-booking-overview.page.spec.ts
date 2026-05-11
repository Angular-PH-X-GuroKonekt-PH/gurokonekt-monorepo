import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorBookingOverviewPage } from './mentor-booking-overview.page';

describe('MentorBookingOverviewPage', () => {
  let component: MentorBookingOverviewPage;
  let fixture: ComponentFixture<MentorBookingOverviewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorBookingOverviewPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorBookingOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
