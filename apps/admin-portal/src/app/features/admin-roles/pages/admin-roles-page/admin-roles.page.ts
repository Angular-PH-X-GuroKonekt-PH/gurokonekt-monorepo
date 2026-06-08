import { Component, inject, OnInit, signal } from '@angular/core';
import { AdminRolesService, AdminAccount } from '../../services/admin-roles.service';

@Component({
  selector: 'app-admin-roles-page',
  templateUrl: './admin-roles.page.html',
})
export class AdminRolesPage implements OnInit {
  private readonly adminRolesService = inject(AdminRolesService);

  protected admins = signal<AdminAccount[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.adminRolesService.getAdmins().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success' && res.data) {
          this.admins.set(res.data.admins);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load admin accounts.');
      },
    });
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  protected fullName(admin: AdminAccount): string {
    return [admin.firstName, admin.middleName, admin.lastName].filter(Boolean).join(' ');
  }
}
