import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-us',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.scss',
})
export class ContactUs {
  contactForm!: FormGroup;

  isSubmissionInProgress = signal(false);
  formSubmitted = signal(false);
  errorMessage = signal('');
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
    this.formSubmitted.set(true);

    if (this.contactForm.invalid) return;

    this.isSubmissionInProgress.set(true);
    this.errorMessage.set('');

    const formValue = {
      ...this.contactForm.value
    };

    try {
      // Add form submission logic here
      // Example: await this.contactService.submitContactForm(formValue);

      // Success handling
      // Example: alert('Message sent successfully!');
      this.contactForm.reset();
      this.formSubmitted.set(false);
    } catch (error: any) {

      if (error.status === 400) {
        this.errorMessage.set(error.error?.message || 'Unable to process your request. Please verify your information and try again.');
      } else if (error.status === 500) {
        this.errorMessage.set('Server error. Please try again later.');
      } else if (error.status === 0) {
        this.errorMessage.set('Network error. Please check your connection and try again.');
      } else {
        this.errorMessage.set('An unexpected error occurred. Please try again.');
      }
    } finally {
      this.isSubmissionInProgress.set(false);
    }
  }

  onClear(): void {
    this.contactForm.reset();
    this.formSubmitted.set(false);
    this.errorMessage.set('');
  }
}
