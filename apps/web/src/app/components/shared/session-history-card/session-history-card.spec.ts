import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionHistoryCard } from './session-history-card';

describe('SessionHistoryCard', () => {
  let component: SessionHistoryCard;
  let fixture: ComponentFixture<SessionHistoryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionHistoryCard],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionHistoryCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
