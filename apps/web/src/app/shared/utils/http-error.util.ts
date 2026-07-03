import { HttpErrorResponse } from '@angular/common/http';

const SESSION_EXPIRED_CODE = 'SESSION_EXPIRED';
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register-mentee',
  '/auth/register-mentor',
  '/auth/verify-email',
  '/auth/resend-confirmation-link',
  '/auth/refresh-token',
] as const;

function isUnauthorizedProtectedRoute(error: HttpErrorResponse): boolean {
  const url = error.url ?? '';
  return !PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export function isSessionExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errorCode = getErrorCode(error as Record<string, unknown>);
  if (errorCode === SESSION_EXPIRED_CODE) {
    return true;
  }

  const message = (error as { message?: string }).message;
  if (message === SESSION_EXPIRED_MESSAGE) {
    return true;
  }

  const originalError = (error as { originalError?: HttpErrorResponse }).originalError;
  if (originalError instanceof HttpErrorResponse && originalError.status === 401) {
    return isUnauthorizedProtectedRoute(originalError);
  }

  const statusCode = (error as { statusCode?: number }).statusCode;
  if (statusCode === 401 && originalError instanceof HttpErrorResponse) {
    return isUnauthorizedProtectedRoute(originalError);
  }

  return false;
}

function getErrorCode(error: HttpErrorResponse | Record<string, unknown>): string | undefined {
  if (error instanceof HttpErrorResponse) {
    return error.error?.errorCode;
  }

  const originalError = error['originalError'] as HttpErrorResponse | undefined;
  if (originalError instanceof HttpErrorResponse) {
    return originalError.error?.errorCode;
  }

  const nestedError = error['error'] as { errorCode?: string } | undefined;
  return nestedError?.errorCode;
}

/**
 * Centralized HTTP error handling helper for consistent error messaging
 */
export function getErrorMessage(error: HttpErrorResponse | any): string {
  const errorCode = getErrorCode(error);

  if (error instanceof HttpErrorResponse) {
    const serverMessage = error.error?.message || error.message;
    return mapStatusToMessage(error.status, serverMessage, errorCode, error);
  }

  if (error && typeof error === 'object' && 'status' in error) {
    return mapStatusToMessage(error.status, error.message, errorCode);
  }

  if (error && typeof error === 'object' && 'statusCode' in error) {
    const originalError = error.originalError as HttpErrorResponse | undefined;
    return mapStatusToMessage(error.statusCode, error.message, errorCode, originalError);
  }

  return error?.message || 'An unexpected error occurred. Please try again.';
}

function mapStatusToMessage(
  status: number,
  serverMessage?: string,
  errorCode?: string,
  error?: HttpErrorResponse | Record<string, unknown>
): string {
  if (status === 401 && errorCode === SESSION_EXPIRED_CODE) {
    return SESSION_EXPIRED_MESSAGE;
  }

  if (
    status === 401 &&
    error instanceof HttpErrorResponse &&
    isUnauthorizedProtectedRoute(error)
  ) {
    return SESSION_EXPIRED_MESSAGE;
  }

  switch (status) {
    case 400:
      return serverMessage || 'Please check your information and try again.';
    case 401:
      return 'Invalid credentials. Please check your email and password.';
    case 403:
      return 'Access denied. Please check your permissions.';
    case 409:
      return serverMessage || 'An account with this email already exists. Please try logging in instead.';
    case 422:
      return 'Validation failed. Please check your inputs and try again.';
    case 429:
      return serverMessage || 'Too many requests. Please wait a moment before trying again.';
    case 500:
      return 'Server error. Please try again in a few moments.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return serverMessage || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get user-friendly error message for registration errors
 */
export function getAuthErrorMessage(error: any): string {
  const errorCode = getErrorCode(error);
  const status = error?.status ?? error?.statusCode;

  if (status === 401 && errorCode === SESSION_EXPIRED_CODE) {
    return SESSION_EXPIRED_MESSAGE;
  }

  const message = getErrorMessage(error);

  if (status === 401) {
    return 'Invalid email or password. Please try again.';
  }

  if (status === 403) {
    return 'Please verify your email before logging in.';
  }

  return message;
}

export function getRegistrationErrorMessage(error: any): string {
  if (error.status === 400) {
    return error.message || 'Please check your information and try again.';
  }
  if (error.status === 409) {
    return 'An account with this email already exists. Please try logging in instead.';
  }
  if (error.status === 500) {
    return 'Server error. Please try again in a few moments.';
  }
  if (error.message) {
    return error.message;
  }

  return 'Registration failed. Please try again.';
}

export function logError(context: string, error: any): void {
  console.error(`${context}:`, {
    message: error?.message,
    status: error?.status,
    error,
  });
}
