import { Component, input } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import type { IconName } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-email-verification-result-layout',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './email-verification-result-layout.component.html',
})
export class EmailVerificationResultLayoutComponent {
  readonly iconName = input.required<IconName>();
  readonly iconWrapperClass = input.required<string>();
  readonly iconClass = input.required<string>();
  readonly title = input.required<string>();
}
