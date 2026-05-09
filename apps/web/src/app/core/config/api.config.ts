import { environment } from "apps/web/src/environments/environment";
import { API_ENDPOINTS } from "../../shared/constants/api-endpoints.constants";


export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: API_ENDPOINTS,
} as const;