import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorDashboard } from './mentor-dashboard';

describe('MentorDashboard', () => {
  let component: MentorDashboard;
  let fixture: ComponentFixture<MentorDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
