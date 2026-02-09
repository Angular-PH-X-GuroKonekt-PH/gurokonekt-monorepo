export interface RegisterMenteeRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  country: string;
  timezone: string;
  language: string;
}