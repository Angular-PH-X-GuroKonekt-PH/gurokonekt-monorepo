export type BookingTableFooterMode = 'pagination' | 'viewAll' | 'none';
export type BookingCounterparty = 'mentor' | 'mentee';
export type BookingSortKey = 'counterparty' | 'sessionDateTime' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface BookingSortChange {
  key: BookingSortKey;
  direction: SortDirection;
}
