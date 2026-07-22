import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { of, startWith, switchMap } from 'rxjs';
import {
  getFormErrorMessage,
  hasError,
} from '../../../utils/form-validation.util';

@Component({
  selector: 'app-profile-setup-bio',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile-setup-bio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  host: { class: 'block' },
})
export class ProfileSetupBioComponent {
  readonly form = input.required<FormGroup>();
  readonly label = input('Short Bio');
  readonly placeholder = input(
    'Tell us about yourself, your background, and what you are looking to achieve through mentorship...'
  );
  readonly maxLength = input(500);
  readonly minLength = input(50);

  private readonly bioValue = toSignal(
    toObservable(this.form).pipe(
      switchMap((form) => {
        const control = form.get('bio');
        return control
          ? control.valueChanges.pipe(startWith(control.value))
          : of('');
      })
    ),
    { initialValue: '' }
  );

  protected readonly bioLength = computed(
    () => (this.bioValue() as string | null)?.length || 0
  );

  protected hasBioError(): boolean {
    return hasError(this.form(), 'bio');
  }

  protected getBioErrorMessage(): string {
    return getFormErrorMessage(this.form(), 'bio');
  }
}
