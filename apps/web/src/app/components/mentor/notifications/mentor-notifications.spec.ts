import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorNotifications } from './mentor-notifications';

describe('MentorNotifications', () => {
  let component: MentorNotifications;
  let fixture: ComponentFixture<MentorNotifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorNotifications],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorNotifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
