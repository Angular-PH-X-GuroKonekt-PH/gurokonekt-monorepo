export interface RegisterMenteeRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  phoneNumber: string;
  password: string;
  country: string;
  timezone: string;
  language: string;
}

export interface RegisterMentorRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  phoneNumber: string;
  password: string;
  country: string;
  timezone: string;
  language: string;
  yearsOfExperience: number;
  linkedInUrl: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'mentee' | 'mentor';
  };
  token?: string;
  message: string;
}