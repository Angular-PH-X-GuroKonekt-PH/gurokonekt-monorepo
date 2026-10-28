import { API_RESPONSE } from '@gurokonekt/models';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, Session, SupabaseClient, UserIdentity } from '@supabase/supabase-js';

/** The parts of a session needed to act as its user. */
export interface SessionTokens {
  access_token: string;
  refresh_token?: string;
}

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly supabaseAdmin: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      this.logger.error(API_RESPONSE.ERROR.SUPABASE_CREDENTIALS_NOT_FOUND);
      throw new Error(API_RESPONSE.ERROR.SUPABASE_CREDENTIALS_NOT_FOUND.message);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get clientAdmin(): SupabaseClient {
    return this.supabaseAdmin;
  }

  /**
   * Starts a normal Supabase session for a user whose identity the API has
   * already verified another way (a passkey), since Supabase has no passkey
   * sign-in of its own. A one-time magic-link token is generated and redeemed
   * on the spot: no email is sent, and the token can't be used again.
   * A fresh client is used so no session is left on the shared ones.
   */
  /**
   * A throwaway client acting as one user, for the identity calls Supabase
   * only allows on the user's own session (link/unlink). Nothing is stored on
   * the shared clients.
   */
  private async clientForSession(session: SessionTokens): Promise<SupabaseClient | null> {
    const client = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token ?? '',
    });
    if (error) {
      this.logger.warn(`Could not act as the user: ${error.message}`);
      return null;
    }
    return client;
  }

  /**
   * Removes one sign-in method from the session's user. Returns the user's
   * current session afterwards (it may have been refreshed), or null.
   */
  async unlinkIdentityWithSession(session: SessionTokens, identity: UserIdentity): Promise<Session | null> {
    const client = await this.clientForSession(session);
    if (!client) return null;

    const { error } = await client.auth.unlinkIdentity(identity);
    if (error) {
      this.logger.error(`Could not unlink ${identity.provider} identity: ${error.message}`);
      return null;
    }
    const { data } = await client.auth.getSession();
    return data.session;
  }

  /**
   * Connects a Google account to the session's user from a Google ID token.
   * Needs "manual linking" enabled in the Supabase project.
   */
  async linkGoogleWithSession(
    session: SessionTokens,
    idToken: string,
    nonce?: string
  ): Promise<{ session: Session | null; error: { code?: string; message: string } | null }> {
    const client = await this.clientForSession(session);
    if (!client) {
      return { session: null, error: { code: 'session_invalid', message: 'Could not act as the user' } };
    }

    const { data, error } = await client.auth.linkIdentity({ provider: 'google', token: idToken, nonce });
    if (error) {
      return { session: null, error: { code: error.code, message: error.message } };
    }
    return { session: data.session, error: null };
  }

  async createSessionForVerifiedUser(email: string): Promise<Session | null> {
    const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      this.logger.error(`Could not issue a sign-in token: ${error?.message ?? 'no token returned'}`);
      return null;
    }

    const client = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: verified, error: verifyError } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });
    if (verifyError || !verified?.session) {
      this.logger.error(`Could not start a session: ${verifyError?.message ?? 'no session returned'}`);
      return null;
    }

    return verified.session;
  }

  /**
   * Counts auth accounts whose email has not been confirmed yet.
   * Email confirmation lives in Supabase (auth.users.email_confirmed_at), not
   * in the local User table, so we paginate the admin user list and tally the
   * accounts with no confirmation timestamp.
   */
  async countUnverifiedEmailAccounts(): Promise<number> {
    const perPage = 1000;
    let page = 1;
    let count = 0;

    for (;;) {
      const { data, error } = await this.supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const users = data?.users ?? [];
      count += users.filter((u) => !u.email_confirmed_at).length;

      if (users.length < perPage) break;
      page += 1;
    }

    return count;
  }
}
