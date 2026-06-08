import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { DashboardService, GrowthPeriod, GrowthWindow } from '../../services/dashboard.service';

Chart.register(CategoryScale, LinearScale, LineController, PointElement, LineElement, Title, Tooltip, Legend, Filler);

@Component({
  selector: 'app-growth-chart',
  imports: [],
  templateUrl: './growth-chart.html',
})
export class GrowthChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly dashboardService = inject(DashboardService);
  private chartInstance: Chart | null = null;

  protected period = signal<GrowthPeriod>('daily');
  protected window = signal<GrowthWindow>('30d');
  protected loading = signal(true);
  protected error = signal<string | null>(null);

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

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
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
          const raw = res.data as any;
          const points: { label: string; registrations?: number; bookings?: number }[] = raw.points ?? [];
          const labels = points.map((p) => p.label);
          const registrations = points.map((p) => p.registrations ?? 0);
          const bookings = points.map((p) => p.bookings ?? 0);
          this.renderChart(labels, registrations, bookings);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load chart data.');
      },
    });
  }

  private renderChart(labels: string[], registrations: number[], bookings: number[]): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    this.chartInstance?.destroy();

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Registrations',
            data: registrations,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: 'Bookings',
            data: bookings,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
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
      },
    });
  }
}
