import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-profile-setup-stepper',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './profile-setup-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSetupStepperComponent {
  readonly stepTitles = input.required<string[]>();
  readonly currentStep = input.required<number>();
}
