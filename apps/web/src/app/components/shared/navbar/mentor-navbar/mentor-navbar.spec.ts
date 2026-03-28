import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorNavbar } from './mentor-navbar';

describe('MentorNavbar', () => {
  let component: MentorNavbar;
  let fixture: ComponentFixture<MentorNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
