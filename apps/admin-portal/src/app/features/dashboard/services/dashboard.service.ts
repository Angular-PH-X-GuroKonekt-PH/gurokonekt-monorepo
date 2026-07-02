import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface DashboardMetrics {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  pendingMentorApprovals: number;
  activeBookings: number;
  completedSessions: number;
  newMentorsThisMonth: number;
  newMenteesThisMonth: number;
  unverifiedEmailAccounts: number;
}

export interface GrowthChartData {
  labels: string[];
  registrations?: number[];
  bookings?: number[];
}

export type GrowthMetric = 'registrations' | 'bookings' | 'all';
export type GrowthPeriod = 'daily' | 'weekly' | 'monthly' | 'annually';
export type GrowthWindow = '7d' | '30d' | '3m' | '6m' | '12m';

export interface GrowthChartQuery {
  metric?: GrowthMetric;
  period?: GrowthPeriod;
  window?: GrowthWindow;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getMetrics(): Observable<ApiResponse<DashboardMetrics>> {
    return this.http.get<ApiResponse<DashboardMetrics>>(
      buildApiUrl(API_CONFIG.endpoints.admin.dashboard)
    );
  }

  getGrowthChart(query: GrowthChartQuery = {}): Observable<ApiResponse<GrowthChartData>> {
    return this.http.get<ApiResponse<GrowthChartData>>(
      buildApiUrl(API_CONFIG.endpoints.admin.dashboardGrowth),
      { params: query as Record<string, string> }
    );
  }
}
