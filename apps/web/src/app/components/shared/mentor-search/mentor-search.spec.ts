import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorSearch } from './mentor-search';

describe('MentorSearch', () => {
  let component: MentorSearch;
  let fixture: ComponentFixture<MentorSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
