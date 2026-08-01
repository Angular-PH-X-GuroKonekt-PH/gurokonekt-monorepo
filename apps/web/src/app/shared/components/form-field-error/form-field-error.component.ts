import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getFormErrorMessage, hasError } from '../../utils/form-validation.util';

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  template: `
    @if (isVisible()) {
      <p [class]="errorClass()">{{ getMessage() }}</p>
    }
  `,
  host: { class: 'contents' },
})
export class FormFieldErrorComponent {
  readonly form = input.required<FormGroup>();
  readonly controlName = input.required<string>();
  /** Per-error-key overrides to preserve exact copy where needed. */
  readonly messages = input<Readonly<Partial<Record<string, string>>>>({});
  readonly errorClass = input('text-red-600 text-sm mt-1');

  // Methods (not computed): FormControl touched/invalid are not signals, so
  // visibility must re-check on each change-detection pass after blur/submit.
  protected isVisible(): boolean {
    return hasError(this.form(), this.controlName());
  }

  protected getMessage(): string {
    const control = this.form().get(this.controlName());
    const errors = control?.errors;
    if (!errors) {
      return '';
    }

    const errorKey = Object.keys(errors)[0];
    const override = this.messages()[errorKey];
    if (override) {
      return override;
    }

    return getFormErrorMessage(this.form(), this.controlName());
  }
}
