import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RETURN_MESSAGES } from '@gurokonekt/models/constants';
import { AsyncReturn, AsyncStatus, ResendEmailChangeEmail, ResendEmailSignUpConfirmation, SignInInputInterface, SignInWithOAth, SignUpInputInterface, UpdateEmailForAnAuthenticatedUser, UpdatePasswordForAnAuthenticatedUser } from '@gurokonekt/models';
import { RegisterMenteeDto } from '../dto/auth/register-mentee.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import { RegisterMentorDto } from '../dto/auth/register-mentor.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private readonly prisma: PrismaService) {
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

  // register mentee
  async registerMentee(dto: RegisterMenteeDto): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: dto.email,
        password: dto.password
      });   

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      const authId = data.user?.id!;
      const mentee = await this.prisma.db.user.create({
        data: {
          id: authId,
          firstName: dto.firstName,
          middleName: dto.middleName ?? null,
          lastName: dto.lastName,
          suffix: dto.suffix ?? null,
          email: dto.email,
          country: dto.country,
          language: dto.language ?? null,
          role: UserRole.Mentee,
          status: UserStatus.Active,

          // createdBy: { connect: { id: authId } },
          // updatedBy: { connect: { id: authId } },
        },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.REGISTER_MENTEE,
        data: {
          auth: data,
          user: mentee
        }
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.REGISTER_MENTEE,
        data: error
      }
    }
  }

  // register mentor
  async registerMentor(dto: RegisterMentorDto): Promise<AsyncReturn> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: dto.email,
        password: dto.password
      });   

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      const authId = data.user?.id!;

      const transaction = await this.prisma.db.$transaction(async (tx) => { 
        const mentor = await tx.user.create({
          data: {
            id: authId,
            firstName: dto.firstName,
            middleName: dto.middleName ?? null,
            lastName: dto.lastName,
            suffix: dto.suffix ?? null,
            email: dto.email,
            country: dto.country,
            language: dto.language ?? null,
            role: UserRole.Mentor,
            status: UserStatus.PendingApproval,
            // createdBy: { connect: { id: authId } },
            // updatedBy: { connect: { id: authId } },
          },
        });

        const mentorProfile = await tx.mentorProfile.create({
          data: {
            yearsOfExperience: dto.yearsOfExperience ?? null,
            linkedInUrl: dto.linkedInUrl ?? null,
            skills: [],
            availability: [],
            user: { connect: { id: authId } },
            updatedBy: { connect: { id: authId } },
          },
          include: { user: true, updatedBy: true },
        });

        return { user: mentor, profile: mentorProfile };
      });
      

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.REGISTER_MENTOR,
        data: {
          auth: data,
          user: transaction.user,
          profile: transaction.profile
        }
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.REGISTER_MENTOR,
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
