export interface RegisterMenteeInterface {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  language: string;
  timezone: string;
  phoneNumber: string;
}

export interface RegisterMentorInterface {
  firstName: string;
  middleName?: string;
  lastName: string;
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
  files: File[];
}