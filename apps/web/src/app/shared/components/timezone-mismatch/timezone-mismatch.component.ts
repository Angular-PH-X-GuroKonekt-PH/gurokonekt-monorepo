import { Component, inject } from '@angular/core';

import { UserTimezoneService } from '../../services/user-timezone.service';

@Component({
  selector: 'app-timezone-mismatch',
  standalone: true,
  templateUrl: './timezone-mismatch.component.html',
})
export class TimezoneMismatchComponent {
  protected readonly timezoneService = inject(UserTimezoneService);
  protected errorMessage: string | null = null;

  protected keepProfileTimezone(): void {
    this.errorMessage = null;
    this.timezoneService.dismissPrompt();
  }

  protected async useDeviceTimezone(): Promise<void> {
    this.errorMessage = null;

    try {
      await this.timezoneService.useDeviceTimezone();
    } catch {
      this.errorMessage =
        'Unable to update your timezone. Your profile timezone will continue to be used.';
    }
  }
}
