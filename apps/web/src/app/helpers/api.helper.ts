import { API_CONFIG } from '../config/api.config';

/**
 * Helper function to build full API URLs
 * @param endpoint - The endpoint path to append to base URL
 * @returns Full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};