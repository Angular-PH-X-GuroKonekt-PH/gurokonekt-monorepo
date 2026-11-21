export interface InitiateDeactivationRequest {
  password: string;
}

export interface VerifyDeactivationTokenResponse {
  userId: string;
}

export interface DeactivationFeedbackRequest {
  token: string;
  reason: string;
}

export interface ActivateAccountResponse {
  status: string;
  activationStatus: 'approved' | 'pending';
}

export interface ActivationRequestStatus {
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  /** Admin's reason when a mentor request was rejected. */
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}
