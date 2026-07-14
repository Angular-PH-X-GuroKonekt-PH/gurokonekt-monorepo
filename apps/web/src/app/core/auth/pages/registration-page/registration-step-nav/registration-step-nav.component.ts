import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-registration-step-nav',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './registration-step-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationStepNavComponent {
  readonly currentStep = input.required<number>();
  readonly totalSteps = input.required<number>();
  readonly canProceed = input.required<boolean>();
  readonly isLoading = input(false);
  readonly isSubmitDisabled = input(false);
  readonly submitLabel = input.required<string>();
  readonly submitLoadingLabel = input.required<string>();

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly backToRole = output<void>();
}
