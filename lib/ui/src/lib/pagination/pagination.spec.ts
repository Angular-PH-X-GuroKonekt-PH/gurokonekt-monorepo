import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Paginatiion } from './pagination';

describe('Paginatiion', () => {
  let component: Paginatiion;
  let fixture: ComponentFixture<Paginatiion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Paginatiion],
    }).compileComponents();

    fixture = TestBed.createComponent(Paginatiion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
