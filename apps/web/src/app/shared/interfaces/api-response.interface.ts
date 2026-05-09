export interface ApiResponse<T = unknown> {
  status: string;
  statusCode: number;
  message: string;
  data: T | null;
}
