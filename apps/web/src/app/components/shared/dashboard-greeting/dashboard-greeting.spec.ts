import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardGreeting } from './dashboard-greeting';

describe('DashboardGreeting', () => {
  let component: DashboardGreeting;
  let fixture: ComponentFixture<DashboardGreeting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardGreeting],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardGreeting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
