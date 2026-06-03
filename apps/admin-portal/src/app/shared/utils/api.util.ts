import { API_CONFIG } from '../../core/config/api.config';

export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};
