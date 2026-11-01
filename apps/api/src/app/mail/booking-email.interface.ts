export interface BookingCreatedEmailInput {
  to: string;
  mentorFirstName: string;
  menteeName: string;
  sessionDateTime: Date;
  timeZone: string;
  durationMinutes: number | null;
  bookingDetails: string | null;
  reviewUrl: string;
}

interface BookingDecisionEmailInput {
  to: string;
  menteeFirstName: string;
  mentorName: string;
  sessionDateTime: Date;
  timeZone: string;
  bookingDetails: string | null;
  reviewUrl: string;
}

export interface BookingAcceptedEmailInput extends BookingDecisionEmailInput {
  sessionLink: string;
}

export interface BookingRejectedEmailInput extends BookingDecisionEmailInput {
  declineReason: string | null;
}

export interface BookingRescheduledEmailInput {
  to: string;
  menteeFirstName: string;
  mentorName: string;
  previousSessionDateTime: Date;
  newSessionDateTime: Date;
  timeZone: string;
  bookingDetails: string | null;
  bookingStatus: string;
  reviewUrl: string;
}
