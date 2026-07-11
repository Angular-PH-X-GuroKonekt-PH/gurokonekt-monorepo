import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { createSelectMap } from '@ngxs/store';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';
import { DashboardService, DashboardMetrics } from '../../services/dashboard.service';
import { MetricCardComponent } from '../../components/metric-card/metric-card';
import { ShortcutCardComponent } from '../../components/shortcut-card/shortcut-card';
import { GrowthChartComponent } from '../../components/growth-chart/growth-chart';
import { APP_ROUTES } from '../../../../shared/constants/routes';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [MetricCardComponent, ShortcutCardComponent, GrowthChartComponent, RouterLink],
  templateUrl: './admin-dashboard.page.html',
})
export class AdminDashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly selectors = createSelectMap({
    user: AuthSelectors.user,
  });

  protected readonly pendingApprovalRoute = APP_ROUTES.MENTOR_MANAGEMENT;

  protected metrics = signal<DashboardMetrics | null>(null);
  protected metricsLoading = signal(true);
  protected metricsError = signal<string | null>(null);

  protected readonly shortcuts = [
    { label: 'Pending Mentor Approvals', route: '/' + APP_ROUTES.MENTOR_MANAGEMENT, icon: 'verified-badge' as const, iconBg: 'bg-yellow-50 text-yellow-600' },
    { label: 'Manage Users', route: '/' + APP_ROUTES.MENTEE_MANAGEMENT, icon: 'users' as const, iconBg: 'bg-blue-50 text-blue-600' },
    { label: 'View Bookings', route: '/' + APP_ROUTES.BOOKING_MANAGEMENT, icon: 'calendar-days' as const, iconBg: 'bg-green-50 text-green-600' },
    { label: 'System Reports', route: '/' + APP_ROUTES.REPORTS, icon: 'chart-bar-square' as const, iconBg: 'bg-purple-50 text-purple-600' },
  ];

  ngOnInit(): void {
    this.dashboardService.getMetrics().subscribe({
      next: (res) => {
        this.metricsLoading.set(false);
        if (res.status === 'success') {
          this.metrics.set(res.data);
        } else {
          this.metricsError.set('Failed to load metrics.');
        }
      },
      error: () => {
        this.metricsLoading.set(false);
        this.metricsError.set('Failed to load metrics.');
      },
    });
  }
}
