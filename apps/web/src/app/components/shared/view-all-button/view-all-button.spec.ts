import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewAllButton } from './view-all-button';

describe('ViewAllButton', () => {
  let component: ViewAllButton;
  let fixture: ComponentFixture<ViewAllButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllButton],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewAllButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
