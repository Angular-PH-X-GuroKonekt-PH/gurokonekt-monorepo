import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-profile-setup-step-nav',
  standalone: true,
  templateUrl: './profile-setup-step-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProfileSetupStepNavComponent {
  readonly currentStep = input.required<number>();
  readonly totalSteps = input.required<number>();
  readonly canProceed = input.required<boolean>();
  readonly isLoading = input(false);
  readonly nextLabel = input('Continue');
  readonly submitLabel = input('Save Profile');
  readonly submitLoadingLabel = input('Saving...');

  readonly previous = output<void>();
  readonly next = output<void>();
}
