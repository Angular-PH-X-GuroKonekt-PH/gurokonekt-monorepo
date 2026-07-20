import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgetPasswordPage } from './forget-password-page';

describe('ForgetPasswordPage', () => {
  let component: ForgetPasswordPage;
  let fixture: ComponentFixture<ForgetPasswordPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgetPasswordPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgetPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
