import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';

export interface TimeFrame {
  from: string;
  to: string;
}

export interface DayAvailability {
  day: DaysInWeek;
  enabled: boolean;
  timeFrames: TimeFrame[];
}