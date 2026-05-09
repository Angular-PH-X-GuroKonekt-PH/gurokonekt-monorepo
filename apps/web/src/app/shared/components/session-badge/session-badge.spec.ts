import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionBadge } from './session-badge';

describe('SessionBadge', () => {
  let component: SessionBadge;
  let fixture: ComponentFixture<SessionBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
