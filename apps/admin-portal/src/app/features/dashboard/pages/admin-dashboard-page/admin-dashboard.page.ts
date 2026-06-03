import { Component, inject } from '@angular/core';
import { Store, createSelectMap } from '@ngxs/store';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';

@Component({
  selector: 'app-admin-dashboard-page',
  templateUrl: './admin-dashboard.page.html',
})
export class AdminDashboardPage {
  protected readonly selectors = createSelectMap({
    user: AuthSelectors.user,
  });
}
