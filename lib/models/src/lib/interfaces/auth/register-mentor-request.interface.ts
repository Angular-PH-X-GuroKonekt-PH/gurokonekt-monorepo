export interface RegisterMentorRequest {
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
  yearsOfExperience: number;
  linkedInUrl?: string;
  areasOfExpertise: string[];
  files: any[];
}