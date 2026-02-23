import { Component, signal, output } from '@angular/core';
import { Role } from '@gurokonekt/models';
import { IconComponent } from '../shared/icon/icon.component';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './role-selection.html',
  styleUrl: './role-selection.scss',
})
export class RoleSelection {
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
