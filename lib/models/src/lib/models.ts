/** ===============================
 *  Common Types
 *  =============================== */

export enum ProfileType {
  MENTEE = "mentee",
  MENTOR = "mentor",
}

export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "12:00"
}

export interface WeeklyAvailability {
  day: Weekday;
  slots: TimeSlot[];
}

export enum MentorStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
}


