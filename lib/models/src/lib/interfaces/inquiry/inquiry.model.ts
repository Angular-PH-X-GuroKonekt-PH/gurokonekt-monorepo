/** A contact form submission from the public marketing site. */
export interface InquiryInterface {
  id: string;
  fullName: string;
  email: string;
  /** The submitter's subject line. Surfaced as "Subject" in the admin portal. */
  topic: string;
  message: string;
  createdAt: string;
}

/**
 * What the public endpoint returns after a successful submission.
 *
 * Deliberately minimal — echoing the submitted content back to an anonymous
 * caller serves no purpose.
 */
export interface CreateInquiryResultInterface {
  id: string;
  createdAt: string;
}

export interface InquiryListResponseInterface {
  data: InquiryInterface[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
