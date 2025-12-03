/** ===============================
 *  Common Types
 *  =============================== */

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

export type MentorStatus = 
  | "PENDING"
  | "ACTIVE"
  | "REJECTED";


