import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenteeLayout } from './mentee-layout';

describe('MenteeLayout', () => {
  let component: MenteeLayout;
  let fixture: ComponentFixture<MenteeLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenteeLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(MenteeLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
