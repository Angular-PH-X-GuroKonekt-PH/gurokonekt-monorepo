export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED',
}

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
