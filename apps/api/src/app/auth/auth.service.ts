import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RETURN_MESSAGES } from '@gurokonekt/models/constants';
import { AsyncReturn, AsyncStatus, ResendEmailChangeEmail, ResendEmailSignUpConfirmation, SignInInputInterface, SignInWithOAth, SignUpInputInterface, UpdateEmailForAnAuthenticatedUser, UpdatePasswordForAnAuthenticatedUser } from '@gurokonekt/models';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error(RETURN_MESSAGES.FAILURE.SUPABASE_CREDENTIALS_NOT_FOUND);
    }
  }

  async signUpWithEmailPassword(input: SignUpInputInterface): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        ...(input.options
          ? { 
              options: { 
                emailRedirectTo: 
                  input.options.emailRedirectTo || 
                  RETURN_MESSAGES.LINKS.DEFAULT_REDIRECT_URL
              } 
            }
          : {}),
      });   

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }
      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.SIGN_UP_SUCCESS,
        data: data
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async resendEmailSignUpConfirmation(input: ResendEmailSignUpConfirmation): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.resend({
        type: 'signup',
        email: input.email,
        ...(input.options
          ? { 
              options: { 
                emailRedirectTo: 
                  input.options.emailRedirectTo || 
                  RETURN_MESSAGES.LINKS.DEFAULT_REDIRECT_URL
              } 
            }
          : {}),
      });  

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.EMAIL_SENT,
        data: data || true
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async resendEmailChangeEmail(input: ResendEmailChangeEmail): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.resend({
        type: 'email_change',
        email: input.email
      });  

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.EMAIL_SENT,
        data: data || true
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async signInWithOAuth(input: SignInWithOAth): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: input.provider,
        ...(input.options
          ? { 
              options: { 
                redirectTo: 
                  input.options.emailRedirectTo || 
                  RETURN_MESSAGES.LINKS.DEFAULT_REDIRECT_URL
              } 
            }
          : {})
      });   

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.SIGN_UP_SUCCESS,
        data: data
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async signInWithPassword(input: SignInInputInterface): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.SIGN_IN_SUCCESS,
        data: data
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async updateEmailForAnAuthenticatedUser(input: UpdateEmailForAnAuthenticatedUser): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        email: input.email
      });

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.EMAIL_UPDATED,
        data: data
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async updatePasswordForAnAuthenticatedUser(input: UpdatePasswordForAnAuthenticatedUser): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: input.password
      });
      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }
      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.PASSWORD_UPDATED,
        data: data
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async getUserAuth(): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }
      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.USER_AUTH_RETRIEVED,
        data: data
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async signOut(): Promise<AsyncReturn> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }
      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.SIGN_OUT_SUCCESS,
        data: true
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }
}
