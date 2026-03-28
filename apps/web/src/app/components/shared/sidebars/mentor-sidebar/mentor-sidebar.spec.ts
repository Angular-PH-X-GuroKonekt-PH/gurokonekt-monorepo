import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorSidebar } from './mentor-sidebar';

describe('MentorSidebar', () => {
  let component: MentorSidebar;
  let fixture: ComponentFixture<MentorSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorSidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
