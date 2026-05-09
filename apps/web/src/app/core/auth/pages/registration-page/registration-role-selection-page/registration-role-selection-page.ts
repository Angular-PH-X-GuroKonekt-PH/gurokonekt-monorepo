import { Component, signal, output } from '@angular/core';
import { Role } from '@gurokonekt/models';
import { IconComponent } from 'apps/web/src/app/shared/components/icon/icon.component';

@Component({
  selector: 'app-registration-role-selection-page',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './registration-role-selection-page.html',
})
export class RegistrationRoleSelectionPage {
  protected readonly selectedRole = signal<Role | null>(null);
  readonly roleSelected = output<'mentee' | 'mentor'>();

  protected selectRole(role: Role): void {
    this.selectedRole.set(role);
  }

  protected continue(): void {
    const role = this.selectedRole();
    if (!role) {
      return;
    }

    this.roleSelected.emit(role);
  }
}
