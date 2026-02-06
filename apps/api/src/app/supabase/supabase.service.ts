import { API_RESPONSE } from '@gurokonekt/models';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly supabaseAdmin: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    const supabaseUrl = process.env.TEST_SUPABASE_URL;
    const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

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
}
