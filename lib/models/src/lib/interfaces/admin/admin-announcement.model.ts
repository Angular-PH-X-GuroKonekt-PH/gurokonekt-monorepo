export interface AdminAnnouncementSummaryInterface {
  id: string;
  title: string;
  message: string;
  recipientCount: number;
  createdAt: string;
}

export interface AdminAnnouncementListResponseInterface {
  data: AdminAnnouncementSummaryInterface[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
