import { environment } from '../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints.constants';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: API_ENDPOINTS,
} as const;