export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'mentee' | 'mentor';
  };
  accessToken: string;
  token?: string; // For backward compatibility
  message: string;
}