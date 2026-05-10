import { HttpErrorResponse } from '@angular/common/http';

/**
 * Centralized HTTP error handling helper for consistent error messaging
 */
export function getErrorMessage(error: HttpErrorResponse | any): string {
  if (error && typeof error === 'object' && 'status' in error) {
    return mapStatusToMessage(error.status, error.message);
  }

  if (error instanceof HttpErrorResponse) {
    const serverMessage = error.error?.message || error.message;
    return mapStatusToMessage(error.status, serverMessage);
  }

  return error?.message || 'An unexpected error occurred. Please try again.';
}

function mapStatusToMessage(status: number, serverMessage?: string): string {
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
  const message = getErrorMessage(error);

  if (error.status === 401) {
    return 'Invalid email or password. Please try again.';
  }

  if (error.status === 403) {
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