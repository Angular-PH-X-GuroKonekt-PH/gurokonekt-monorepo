/** What the app shows about a saved passkey. Key material is never exposed. */
export interface PasskeySummaryInterface {
  id: string;
  name: string;
  /** "singleDevice", or "multiDevice" when synced (e.g. iCloud Keychain, Google Password Manager) */
  deviceType: string;
  backedUp: boolean;
  createdAt: Date;
}

export interface VerifyPasskeyRegistrationInterface {
  /** The browser's WebAuthn registration response (RegistrationResponseJSON). */
  response: Record<string, unknown>;
  /** Friendly label, e.g. "Chrome on Windows". */
  name?: string;
}
