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
