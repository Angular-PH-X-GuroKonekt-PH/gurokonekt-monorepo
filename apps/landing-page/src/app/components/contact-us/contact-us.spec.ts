import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ContactUs } from './contact-us';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { environment } from '../../../environments/environment';
import { Inquiries } from '../../shared/services/inquiries/inquiries';
import {
  Recaptcha,
  RecaptchaUnavailableError,
} from '../../shared/services/recaptcha/recaptcha';

const VALID = {
  email: 'maria@example.com',
  fullName: 'Maria Santos',
  topic: 'Becoming a mentor',
  message: 'I would like to know how to apply as a mentor.',
};

describe('ContactUs', () => {
  let fixture: ComponentFixture<ContactUs>;
  let component: any;
  let submit: ReturnType<typeof vi.fn>;
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    submit = vi.fn(() => of({ data: { id: 'i1', createdAt: 'now' } }));
    execute = vi.fn(() => Promise.resolve('token-abc'));

    await TestBed.configureTestingModule({
      imports: [ContactUs],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        { provide: Inquiries, useValue: { submit } },
        { provide: Recaptcha, useValue: { execute } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const fill = (values = VALID) => component.contactForm.setValue(values);
  const el = () => fixture.nativeElement as HTMLElement;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit an invalid form', async () => {
    await component.onSubmit();

    expect(submit).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('sends the form values with a fresh reCAPTCHA token', async () => {
    fill();

    await component.onSubmit();

    expect(execute).toHaveBeenCalledWith('contact_form');
    expect(submit).toHaveBeenCalledWith({ ...VALID, recaptchaToken: 'token-abc' });
  });

  it('resets the form and shows a success message', async () => {
    fill();

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.contactForm.value.email).toBeNull();
    expect(component.formSubmitted()).toBe(false);
    expect(component.successMessage()).toBeTruthy();
    expect(el().querySelector('[data-testid="contact-success"]')).toBeTruthy();
  });

  it('clears the in-progress flag after success', async () => {
    fill();

    await component.onSubmit();

    expect(component.isSubmissionInProgress()).toBe(false);
  });

  // Without the in-progress guard a double click fires two submissions before
  // the disabled attribute has any effect.
  it('ignores a second submit while one is in flight', async () => {
    fill();
    component.isSubmissionInProgress.set(true);

    await component.onSubmit();

    expect(submit).not.toHaveBeenCalled();
  });

  it('shows a specific message when reCAPTCHA cannot load', async () => {
    execute.mockRejectedValue(new RecaptchaUnavailableError('blocked'));
    fill();

    await component.onSubmit();
    fixture.detectChanges();

    expect(submit).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('verify');
    expect(el().querySelector('[data-testid="contact-error"]')).toBeTruthy();
  });

  it('prefers the API message on a 400', async () => {
    submit.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'Bad topic' } })),
    );
    fill();

    await component.onSubmit();

    expect(component.errorMessage()).toBe('Bad topic');
  });

  it('reports a network failure distinctly', async () => {
    submit.mockReturnValue(throwError(() => ({ status: 0 })));
    fill();

    await component.onSubmit();

    expect(component.errorMessage()).toContain('Network');
  });

  it('reports a server failure distinctly', async () => {
    submit.mockReturnValue(throwError(() => ({ status: 500 })));
    fill();

    await component.onSubmit();

    expect(component.errorMessage()).toContain('Server');
  });

  it('keeps the form contents after a failure so the visitor can retry', async () => {
    submit.mockReturnValue(throwError(() => ({ status: 500 })));
    fill();

    await component.onSubmit();

    expect(component.contactForm.value.email).toBe(VALID.email);
    expect(component.successMessage()).toBe('');
  });

  it('clears both messages when the form is cleared', async () => {
    fill();
    await component.onSubmit();

    component.onClear();

    expect(component.successMessage()).toBe('');
    expect(component.errorMessage()).toBe('');
  });
});
