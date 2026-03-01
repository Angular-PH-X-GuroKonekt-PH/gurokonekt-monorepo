import { HttpErrorResponse } from '@angular/common/http';

/**
 * Centralized HTTP error handling helper for consistent error messaging
 */
export class HttpErrorHelper {
  /**
   * Map HTTP error responses to user-friendly messages
   */
  static getErrorMessage(error: HttpErrorResponse | any): string {
    // Handle custom error objects with status and message
    if (error && typeof error === 'object' && 'status' in error) {
      return HttpErrorHelper.mapStatusToMessage(error.status, error.message);
    }

    // Handle HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      const serverMessage = error.error?.message || error.message;
      return HttpErrorHelper.mapStatusToMessage(error.status, serverMessage);
    }

    // Handle generic errors
    return error?.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Map HTTP status codes to user-friendly messages
   */
  private static mapStatusToMessage(status: number, serverMessage?: string): string {
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
   * Get error message specifically for authentication operations
   */
  static getAuthErrorMessage(error: any): string {
    const message = HttpErrorHelper.getErrorMessage(error);
    
    // Add specific context for auth operations
    if (error.status === 401) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (error.status === 403) {
      return 'Please verify your email before logging in.';
    }
    
    return message;
  }

  /**
   * Get user-friendly error message for registration errors
   */
  static getRegistrationErrorMessage(error: any): string {
    if (error.status === 400) {
      return error.message || 'Please check your information and try again.';
    } else if (error.status === 409) {
      return 'An account with this email already exists. Please try logging in instead.';
    } else if (error.status === 500) {
      return 'Server error. Please try again in a few moments.';
    } else if (error.message) {
      return error.message;
    }
    
    return 'Registration failed. Please try again.';
  }

  /**
   * Log error for debugging purposes
   */
  static logError(context: string, error: any): void {
    console.error(`${context}:`, {
      message: error?.message,
      status: error?.status,
      error: error
    });
  }
}