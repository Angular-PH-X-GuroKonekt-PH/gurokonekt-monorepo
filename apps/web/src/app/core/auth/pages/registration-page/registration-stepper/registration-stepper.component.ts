import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-registration-stepper',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './registration-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationStepperComponent {
  readonly stepTitles = input.required<string[]>();
  readonly stepDescriptions = input.required<string[]>();
  readonly currentStep = input.required<number>();
  readonly canNavigate = input.required<(step: number) => boolean>();

  readonly stepSelected = output<number>();
}
