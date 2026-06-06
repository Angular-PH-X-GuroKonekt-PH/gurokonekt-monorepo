import { Component, inject, OnInit, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { DashboardService, GrowthPeriod, GrowthWindow } from '../../services/dashboard.service';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

@Component({
  selector: 'app-growth-chart',
  imports: [BaseChartDirective],
  templateUrl: './growth-chart.html',
})
export class GrowthChartComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected period = signal<GrowthPeriod>('daily');
  protected window = signal<GrowthWindow>('30d');
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  protected chartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });

  protected readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 }, usePointStyle: true } },
      tooltip: { padding: 10 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } } },
    },
  };

  protected readonly periods: { value: GrowthPeriod; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'annually', label: 'Annually' },
  ];

  protected readonly windows: { value: GrowthWindow; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '3m', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '12m', label: 'Last 12 months' },
  ];

  ngOnInit(): void {
    this.loadChart();
  }

  protected onPeriodChange(value: string): void {
    this.period.set(value as GrowthPeriod);
    this.loadChart();
  }

  protected onWindowChange(value: string): void {
    this.window.set(value as GrowthWindow);
    this.loadChart();
  }

  private loadChart(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getGrowthChart({
      metric: 'all',
      period: this.period(),
      window: this.window(),
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          this.chartData.set({
            labels: d.labels,
            datasets: [
              {
                label: 'Registrations',
                data: d.registrations ?? [],
                borderColor: '#f97316',
                backgroundColor: 'rgba(249,115,22,0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
              },
              {
                label: 'Bookings',
                data: d.bookings ?? [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
              },
            ],
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load chart data.');
      },
    });
  }
}
