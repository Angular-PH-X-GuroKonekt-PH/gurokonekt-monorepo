import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse, PaginatedResponse } from '../../../shared/interfaces/api-response.interface';

export interface BookingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarAttachments?: { publicUrl: string }[];
}

export interface BookingFeedback {
  id: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; role: string };
}

export interface BookingListItem {
  id: string;
  menteeId: string;
  mentorId: string;
  sessionDateTime: string;
  status: string;
  sessionLink: string | null;
  notes: string | null;
  cancelReason: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  mentor: BookingUser | null;
  mentee: BookingUser | null;
}

export interface BookingDetail extends BookingListItem {
  feedback: BookingFeedback[];
}

export interface BookingsQueryParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'sessionDateTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class BookingManagementService {
  private readonly http = inject(HttpClient);

  getBookings(params: BookingsQueryParams = {}): Observable<ApiResponse<PaginatedResponse<BookingListItem>>> {
    return this.http.get<ApiResponse<PaginatedResponse<BookingListItem>>>(
      buildApiUrl(API_CONFIG.endpoints.admin.bookings),
      { params: { ...params } as Record<string, string | number> }
    );
  }

  getBookingById(id: string): Observable<ApiResponse<BookingDetail>> {
    return this.http.get<ApiResponse<BookingDetail>>(
      buildApiUrl(API_CONFIG.endpoints.admin.bookingById(id))
    );
  }

  forceCancelBooking(id: string, reason: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.bookingForceCancel(id)),
      { reason }
    );
  }
}
