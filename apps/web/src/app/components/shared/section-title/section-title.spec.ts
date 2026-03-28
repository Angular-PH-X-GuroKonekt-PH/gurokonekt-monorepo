import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionTitle } from './section-title';

describe('SectionTitle', () => {
  let component: SectionTitle;
  let fixture: ComponentFixture<SectionTitle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionTitle],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionTitle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
