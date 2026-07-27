export interface ReviewMenteeAttachmentInterface {
  publicUrl: string;
}

export interface ReviewMenteeSummaryInterface {
  id: string;
  firstName: string;
  lastName: string;
  avatarAttachments?: ReviewMenteeAttachmentInterface[] | null;
}

export interface ReviewInterface {
  id: string;
  bookingId: string;
  mentorId: string;
  menteeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  mentee?: ReviewMenteeSummaryInterface | null;
}

export interface ReviewListResponseInterface {
  data: ReviewInterface[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number | null;
  ratingCount: number;
}
