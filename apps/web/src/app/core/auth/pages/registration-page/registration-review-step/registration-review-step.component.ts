import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-registration-review-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './registration-review-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  host: { class: 'flex flex-col gap-6' },
})
export class RegistrationReviewStepComponent {
  readonly form = input.required<FormGroup>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  /** Plain checkbox row vs highlighted orange panel (mentor). */
  readonly termsVariant = input<'plain' | 'emphasized'>('plain');
  readonly termsLead = input('I accept the');

  protected hasAcceptTermsError(): boolean {
    const control = this.form().get('acceptTerms');
    return !!(control?.touched && control?.invalid);
  }
}
