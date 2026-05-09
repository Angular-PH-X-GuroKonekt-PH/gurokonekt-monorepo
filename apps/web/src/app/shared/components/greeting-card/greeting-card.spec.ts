import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GreetingCard } from './greeting-card';

describe('GreetingCard', () => {
  let component: GreetingCard;
  let fixture: ComponentFixture<GreetingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GreetingCard],
    }).compileComponents();

    fixture = TestBed.createComponent(GreetingCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
