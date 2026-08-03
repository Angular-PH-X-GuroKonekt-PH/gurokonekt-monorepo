import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../../environments/app-config.token';

export interface InquiryPayload {
  email: string;
  fullName: string;
  topic: string;
  message: string;
  recaptchaToken: string;
}

export interface InquiryResult {
  id: string;
  createdAt: string;
}

interface InquiryResponse {
  data?: InquiryResult;
}

@Injectable({ providedIn: 'root' })
export class Inquiries {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);

  /**
   * Submits a contact form inquiry.
   *
   * Unlike the featured-mentors service, errors are **propagated** rather than
   * swallowed — the form needs the status code to tell the visitor whether their
   * input was rejected, they failed verification, or the server is down.
   */
  submit(payload: InquiryPayload): Observable<InquiryResponse> {
    return this.http.post<InquiryResponse>(
      `${this.appConfig.API_URL}/public/inquiries`,
      payload,
    );
  }
}
