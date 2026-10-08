import { API_RESPONSE } from '@gurokonekt/models';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

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
