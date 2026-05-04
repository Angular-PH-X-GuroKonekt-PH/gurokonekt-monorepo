import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendedMentorCard } from './recommended-mentor-card';

describe('RecommendedMentorCard', () => {
  let component: RecommendedMentorCard;
  let fixture: ComponentFixture<RecommendedMentorCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendedMentorCard],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendedMentorCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
