import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LoginDto } from '@gurokonekt/models/authentication/login.dto';
import { SignupDto } from '@gurokonekt/models/authentication/signup.dto';
import { AuthResponseDto } from '@gurokonekt/models/authentication/auth-response.dto';
import { AppErrorMessages } from '../error/error';

@Injectable()
export class AuthenticationService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(AuthenticationService.name);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn('Supabase credentials not found. Authentication will not work until SUPABASE_URL and SUPABASE_KEY are provided in environment variables.');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    if (!this.supabase) {
      const error = new Error(AppErrorMessages.SUPABASE_NOT_INITIALIZED);
      return {
        user: null,
        session: null,
        error,
      };
    }

    const { email, password } = loginDto;
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error: error || null,
    };
  }

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    if (!this.supabase) {
      const error = new Error(AppErrorMessages.SUPABASE_NOT_INITIALIZED);
      return {
        user: null,
        session: null,
        error,
      };
    }

    const { email, password, fullName } = signupDto;
    
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error: error || null,
    };
  }

  async logout(accessToken: string): Promise<{ error: Error | null }> {
    if (!this.supabase) {
      const error = new Error(AppErrorMessages.SUPABASE_NOT_INITIALIZED);
      return {
        error,
      };
    }

    // Set the auth token for this request
    const { error } = await this.supabase.auth.signOut();
    
    return {
      error: error || null,
    };
  }

  async getUser(accessToken: string): Promise<{ user: any; error: Error | null }> {
    if (!this.supabase) {
      const error = new Error(AppErrorMessages.SUPABASE_NOT_INITIALIZED);
      return {
        user: null,
        error,
      };
    }

    // Set the auth token for this request
    const { data, error } = await this.supabase.auth.getUser(accessToken);
    
    return {
      user: data?.user || null,
      error: error || null,
    };
  }
}