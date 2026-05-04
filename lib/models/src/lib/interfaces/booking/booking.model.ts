
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
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  notes?: string | null;
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