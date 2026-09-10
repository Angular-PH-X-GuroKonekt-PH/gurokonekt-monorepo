
export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED',
}

export type BookingFilter = 'ALL' | BookingStatus;


export interface BookingInterface {
  id: string;
  menteeId: string;
  mentorId: string;
  sessionDateTime: Date;
  status: BookingStatus;
  sessionLink?: string;
  menteeNotes?: string | null;
  mentorNotes?: string | null;
  cancelReason?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingFeedbackInterface {
  id: string;
  bookingId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface BookingSessionCardInterface {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorProfilePicture: string | null;
  sessionDateTime: Date;
  sessionRating: number | null;
  status: BookingStatus;
  sessionLink?: string | null;
  menteeNotes?: string | null;
  mentorNotes?: string | null;
  isDeleted: boolean;
}


export interface BookingUserAttachmentInterface {
  publicUrl: string;
}

export interface BookingUserSummaryInterface {
  id: string;
  firstName: string;
  lastName: string;
  avatarAttachments?: BookingUserAttachmentInterface[] | null;
}

export interface BookingWithUsersInterface extends BookingInterface {
  mentor?: BookingUserSummaryInterface | null;
  mentee?: BookingUserSummaryInterface | null;
}

export interface BookingCardInterface extends BookingInterface {
  mentor?: BookingUserSummaryInterface | null;
  mentee?: BookingUserSummaryInterface | null;
}

export interface CreateBookingRequestInterface {
  mentorId: string;
  /** ISO 8601 instant; the frontend sends UTC and the API persists the instant. */
  sessionDateTime: string;
  menteeNotes?: string;
}

export interface UpcomingSession {
  title: string;
  mentor: string;
  dateTime: Date;
  sessionLink?: string | null;
}

export type BookingTab = 'All' | 'Pending' | 'Approved' | 'Completed' | 'Cancelled' | 'Rejected';

export interface ActiveBookingSummaryInterface {
  time: string;
  status: BookingStatus;
}

export interface BookingListResponse {
  data: BookingCardInterface[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type BookingSortBy = 'sessionDateTime' | 'status' | 'mentor' | 'mentee';
export type BookingSortOrder = 'asc' | 'desc';

export interface MentorBookedSlotInterface {
  id: string;
  sessionDateTime: Date;
  status: BookingStatus;
}

export interface MentorBookingQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
  sortBy?: BookingSortBy;
  sortOrder?: BookingSortOrder;
}

export interface UserBookingQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
  sortBy?: BookingSortBy;
  sortOrder?: BookingSortOrder;
}
