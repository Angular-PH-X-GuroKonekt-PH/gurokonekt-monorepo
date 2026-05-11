import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorManageAvailabilityPage } from './mentor-manage-availability.page';

describe('MentorManageAvailabilityPage', () => {
  let component: MentorManageAvailabilityPage;
  let fixture: ComponentFixture<MentorManageAvailabilityPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorManageAvailabilityPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorManageAvailabilityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
