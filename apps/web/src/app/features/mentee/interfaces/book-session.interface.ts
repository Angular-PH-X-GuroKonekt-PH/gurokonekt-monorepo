import { TimeFrameInterface } from '@gurokonekt/models/interfaces/user/user.model';

export interface BookSessionDateOption {
  date: Date;
  day: string;
  dayLabel: string;
  dateLabel: string;
  timeFrames: TimeFrameInterface[];
}

export interface BookSessionSlotOption {
  label: string;
  displayDateTime: Date;
  bookingDateTime: Date;
}
