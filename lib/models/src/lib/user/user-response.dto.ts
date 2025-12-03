import { MentorStatus, WeeklyAvailability } from "../models";

export interface User {
  id: string;

  firstName: string;
  middleName: string;
  lastName: string;
  extensionName?: string;
  email: string;
  passwordHash: string;
  countryOrTimezone: string;
  preferredLanguage?: string;

  acceptedTerms: boolean;
  emailVerified: boolean;

  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  profile: MenteeProfile | MentorProfile | null;
  profileType?: 'mentee' | 'mentor';
  
  // Archive fields
  isArchived: boolean;
  archivedAt?: Date;
}

/** ===============================
 *  Mentee Models
 *  =============================== */
export interface MenteeProfile {
  profilePictureUrl?: string;
  shortBio: string;
  learningGoals: string;
  areasOfInterest: string[];
  preferredSessionType: "online" | "in-person";
  availability?: string; // JSON or formatted
  completed: boolean;
}

/** ===============================
 *  Mentor Models
 *  =============================== */
export interface MentorProfile {
  expertiseAreas: string[];
  yearsOfExperience: number;
  linkedInUrl: string;
  verificationDocuments: VerificationDocument[];
  status: MentorStatus;
  rejectionReason?: string;

  profilePictureUrl?: string;
  professionalBio: string;

  additionalSkills: string[];
  sessionRate?: number;

  availability: WeeklyAvailability[];
  isProfileCompleted: boolean;
}


export interface VerificationDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
}