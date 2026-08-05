import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { TranslationService } from '../../shared/i18n/translation.service';
import { Inquiries } from '../../shared/services/inquiries/inquiries';
import {
  Recaptcha,
  RecaptchaUnavailableError,
} from '../../shared/services/recaptcha/recaptcha';

@Component({
  selector: 'app-contact-us',
  imports: [ReactiveFormsModule, ScrollRevealDirective, TranslatePipe],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.scss',
})
export class ContactUs {
  contactForm!: FormGroup;

  private readonly inquiries = inject(Inquiries);
  private readonly recaptcha = inject(Recaptcha);
  private readonly translation = inject(TranslationService);

  isSubmissionInProgress = signal(false);
  formSubmitted = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  mentors = signal(200);
  courses = signal(400);

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.contactForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      fullName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      topic: new FormControl('', Validators.required),
      message: new FormControl('', [Validators.required, Validators.minLength(10)])
    });
  }

  get email() {
    return this.contactForm.get('email');
  }

  get fullName() {
    return this.contactForm.get('fullName');
  }

  get topic() {
    return this.contactForm.get('topic');
  }

  get message() {
    return this.contactForm.get('message');
  }

  async onSubmit() {
    // Guard first: without this, a double-click fires two submissions before the
    // in-progress flag has any chance to disable the button.
    if (this.isSubmissionInProgress()) return;

    this.formSubmitted.set(true);

    if (this.contactForm.invalid) return;

    this.isSubmissionInProgress.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      // A fresh token per attempt — v3 tokens are single-use and expire in
      // roughly two minutes, so one minted at page load would often be stale.
      const recaptchaToken = await this.recaptcha.execute('contact_form');

      const { email, fullName, topic, message } = this.contactForm.value;

      await firstValueFrom(
        this.inquiries.submit({
          email,
          fullName,
          topic,
          message,
          recaptchaToken,
        }),
      );

      this.contactForm.reset();
      this.formSubmitted.set(false);
      this.successMessage.set(this.translation.translate('contact.successMessage'));
    } catch (error: any) {
      this.errorMessage.set(this.toErrorMessage(error));
    } finally {
      this.isSubmissionInProgress.set(false);
    }
  }

  /**
   * Maps a failure to a message the visitor can act on.
   *
   * The API's own message is preferred for 4xx responses because it is written
   * for the end user (e.g. the reCAPTCHA rejection copy); anything else falls
   * back to a generic string so an internal error never reaches the page.
   */
  private toErrorMessage(error: any): string {
    if (error instanceof RecaptchaUnavailableError) {
      return this.translation.translate('contact.recaptchaError');
    }

    const apiMessage = error?.error?.message;

    if (error?.status === 400 || error?.status === 429) {
      return apiMessage || this.translation.translate('contact.errorInvalid');
    }
    if (error?.status === 502) {
      return apiMessage || this.translation.translate('contact.recaptchaError');
    }
    if (error?.status === 0) {
      return this.translation.translate('contact.errorNetwork');
    }
    if (error?.status >= 500) {
      return this.translation.translate('contact.errorServer');
    }
    return this.translation.translate('contact.errorUnexpected');
  }

  onClear(): void {
    this.contactForm.reset();
    this.formSubmitted.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
