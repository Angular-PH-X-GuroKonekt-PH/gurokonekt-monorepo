import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Availability } from './availability';

describe('Availability', () => {
  let component: Availability;
  let fixture: ComponentFixture<Availability>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Availability],
    }).compileComponents();

    fixture = TestBed.createComponent(Availability);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
