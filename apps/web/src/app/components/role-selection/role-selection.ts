import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);
  protected readonly selectedRole = signal<Role | null>(null);

  protected selectRole(role: Role): void {
    this.selectedRole.set(role);
  }

  protected continue(): void {
    const role = this.selectedRole();
    if (!role) {
      return;
    }

    if (role === 'mentor') {
      void this.router.navigate(['/register/mentor']);
    } else {
      void this.router.navigate(['/register/mentee']);
    }
  }
}
