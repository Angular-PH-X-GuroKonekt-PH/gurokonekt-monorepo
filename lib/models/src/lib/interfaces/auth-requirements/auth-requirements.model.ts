/** A sign-in method the platform can require (#463). Email and password is always required. */
export type AuthSetupRequirement = 'PASSWORD' | 'PASSKEY' | 'GOOGLE_IDP';

/** `errorCode` on the 403 the API returns while an account is missing a required sign-in method. */
export const AUTH_SETUP_REQUIRED_ERROR_CODE = 'AUTH_SETUP_REQUIRED';

/** What admins require of every account before it can use the platform. */
export interface AuthenticationSettingsInterface {
  usernamePasswordRequired: true;
  passkeyRequired: boolean;
  googleIdpRequired: boolean;
  updatedAt: Date | null;
  updatedBy: { id: string; firstName: string; lastName: string; email: string } | null;
}

/** One account measured against the current settings. Always computed, never stored. */
export interface UserAuthenticationStatusInterface {
  userId: string;
  usernamePasswordConfigured: boolean;
  passkeyConfigured: boolean;
  googleIdpConnected: boolean;
  passkeyRequired: boolean;
  googleIdpRequired: boolean;
  requirementsCompleted: boolean;
  missingRequirements: AuthSetupRequirement[];
}
