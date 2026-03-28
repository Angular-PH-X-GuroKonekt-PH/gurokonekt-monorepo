import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorLayout } from './mentor-layout';

describe('MentorLayout', () => {
  let component: MentorLayout;
  let fixture: ComponentFixture<MentorLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
