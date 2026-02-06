import { API_RESPONSE } from '@gurokonekt/models';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly supabaseAdmin: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    const cloudSupabaseUrl = process.env.CLOUD_SUPABASE_URL;
    const cloudSupabaseKey = process.env.CLOUD_SUPABASE_ANON_KEY;
    const cloudServiceRoleKey = process.env.CLOUD_SUPABASE_SERVICE_ROLE_KEY;

    if (!cloudSupabaseUrl || !cloudSupabaseKey || !cloudServiceRoleKey) {
      this.logger.error(API_RESPONSE.ERROR.SUPABASE_CREDENTIALS_NOT_FOUND);
      throw new Error(API_RESPONSE.ERROR.SUPABASE_CREDENTIALS_NOT_FOUND.message);
    }

    this.supabase = createClient(cloudSupabaseUrl, cloudSupabaseKey);
    this.supabaseAdmin = createClient(cloudSupabaseUrl, cloudServiceRoleKey, {
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
