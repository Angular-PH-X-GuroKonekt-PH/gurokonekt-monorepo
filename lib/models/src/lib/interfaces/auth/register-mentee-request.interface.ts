export interface RegisterMenteeRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  language: string;
  timezone: string;
  phoneNumber: string;
}