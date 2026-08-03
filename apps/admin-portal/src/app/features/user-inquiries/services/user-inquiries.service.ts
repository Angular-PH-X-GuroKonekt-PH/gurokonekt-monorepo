import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../../shared/interfaces/api-response.interface';

export interface InquiryListItem {
  id: string;
  fullName: string;
  email: string;
  /** Stored as `topic`; displayed as "Subject". */
  topic: string;
  message: string;
  createdAt: string;
}

export interface InquiriesQueryParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'fullName' | 'email' | 'topic';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class UserInquiriesService {
  private readonly http = inject(HttpClient);

  getInquiries(
    params: InquiriesQueryParams = {},
  ): Observable<ApiResponse<PaginatedResponse<InquiryListItem>>> {
    return this.http.get<ApiResponse<PaginatedResponse<InquiryListItem>>>(
      buildApiUrl(API_CONFIG.endpoints.admin.inquiries),
      { params: { ...params } as Record<string, string | number> },
    );
  }
}
