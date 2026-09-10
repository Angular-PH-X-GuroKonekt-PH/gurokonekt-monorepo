export interface BookSessionDateOption {
  date: Date;
  day: string;
  dayLabel: string;
  dateLabel: string;
  slots: BookSessionSlotOption[];
}

export interface BookSessionSlotOption {
  label: string;
  displayDateTime: Date;
  bookingDateTime: Date;
  sourceDay: string;
  sourceFrom: string;
  sourceTo: string;
  sourceTimezone: string;
  isBooked: boolean;
}
