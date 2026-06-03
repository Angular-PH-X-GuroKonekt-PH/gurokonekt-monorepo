export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data: T | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
