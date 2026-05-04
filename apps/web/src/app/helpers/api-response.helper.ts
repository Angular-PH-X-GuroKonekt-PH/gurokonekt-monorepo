import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { ApiResponse } from '../interfaces/api-response.interface';
import { HttpErrorHelper } from './http-error.helper';

export interface ApiServiceError {
  message: string;
  statusCode: number;
}

export function validateApiResponse<T>(
  response: ApiResponse<T>,
  fallbackMessage = 'Request failed'
): T {
  if (response.status !== 'success' || response.statusCode !== 200) {
    throw {
      message: response.message || fallbackMessage,
      statusCode: response.statusCode || 500,
    };
  }
  return response.data ?? ([] as T);
}



export function handleApiError(
  error: HttpErrorResponse | ApiServiceError | Error
): Observable<never> {
  if (error instanceof HttpErrorResponse) {
    return throwError(() => ({
      message: HttpErrorHelper.getErrorMessage(error),
      statusCode: error.status || 500,
    }));
  }

  if ('statusCode' in error && 'message' in error) {
    return throwError(() => ({
      message: error.message || 'An unexpected error occurred',
      statusCode: error.statusCode || 500,
    }));
  }

  return throwError(() => ({
    message:
      error.message || 'An unexpected error occurred',
    statusCode: 500,
  }));
}

export function handleApiErrorWithFallback<T>(
  fallbackValue: T,
  logLabel = 'API request failed'
) {
  return (error: HttpErrorResponse | ApiServiceError | Error): Observable<T> => {
    const normalizedError =
      error instanceof HttpErrorResponse
        ? {
            message: HttpErrorHelper.getErrorMessage(error),
            statusCode: error.status || 500,
          }
        : 'statusCode' in error && 'message' in error
          ? {
              message: error.message || 'An unexpected error occurred',
              statusCode: error.statusCode || 500,
            }
          : {
              message: error.message || 'An unexpected error occurred',
              statusCode: 500,
            };

    console.error(logLabel, normalizedError, error);

    return of(fallbackValue);
  };
}
