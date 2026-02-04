import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type Role = 'mentee' | 'mentor';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-selection.html',
  styleUrl: './role-selection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      void this.router.navigate(['/mentor/register']);
    } else {
      void this.router.navigate(['/register']);
    }
  }
}
