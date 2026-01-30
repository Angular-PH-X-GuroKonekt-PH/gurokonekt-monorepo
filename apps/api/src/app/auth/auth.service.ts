import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RETURN_MESSAGES } from '@gurokonekt/models/constants';
import { AsyncReturn, AsyncStatus, ResendEmailChangeEmail, ResendEmailSignUpConfirmation, SignInInputInterface, SignInWithOAth, SignUpInputInterface, UpdateEmailForAnAuthenticatedUser, UpdatePasswordForAnAuthenticatedUser } from '@gurokonekt/models';
import { RegisterMenteeDto } from '../dto/auth/register-mentee.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LogsActionType, UserRole, UserStatus } from '@prisma/client';
import { RegisterMentorDto } from '../dto/auth/register-mentor.dto';
import bcrypt from "bcrypt";
import { AsyncReturnDto } from '../dto/models.dto';

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
  /**
   * Flow:
   * 1. check if user exist in db
   * 2. if exist return error else continue
   * 3. check if required fields are present
   * 4. if missing return error else continue
   * 5. create user in users table
   * 6. if error occured, return error else return success with status 201
   * 7. save the activity to logs
   * 8. confirmation email will be sent automatically after signup as per the 
   *    configuration in the supabase authentication
   * */ 
  async registerMentee(dto: RegisterMenteeDto, ipAddress: string, userAgent: string): Promise<AsyncReturnDto> {
    try {
      // Check if user already exists in DB
      const existingUser = await this.prisma.db.user.findUnique({
        where: { email: dto.email }
      });

      if (existingUser) {
        return {
          status: AsyncStatus.Error,
          statusCode: 409,
          message: RETURN_MESSAGES.FAILURE.USER_ALREADY_EXISTS,
          data: null
        };
      }

      // Check required fields
      const requiredFields = [
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.password,
        dto.country,
        dto.language,
        dto.timezone,
        dto.phoneNumber,
      ];

      if (requiredFields.some(field => !field)) {
        return {
          status: AsyncStatus.Error,
          statusCode: 400,
          message: RETURN_MESSAGES.FAILURE.MISSING_REQUIRED_FIELDS,
          data: null
        };
      }

      // Create user in Supabase Auth
      const { data, error } = await this.supabase.auth.signUp({
        email: dto.email,
        password: dto.password
      });   

      if (error) {
        console.error(error);
        return {
          status: AsyncStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      const authId = data.user?.id!;
      const hashPassword = await bcrypt.hash(dto.password, 10);
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
          timezone: dto.timezone ?? null,
          phoneNumber: dto.phoneNumber ?? null,
          hashPassword: hashPassword,
          role: UserRole.mentee,
          status: UserStatus.active,
          createdById: authId,
          updatedById: authId
        },
      });

      // save activity to logs
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.signup,
          targetId: mentee.id, 
          details: `Mentee account registered with email: ${mentee.email}`,
          metadata: { role: mentee.role },
          ipAddress: ipAddress ?? '',  
          userAgent: userAgent ?? '',
          createdById: mentee.id        
        }
      });

      return {
        status: AsyncStatus.Success,
        statusCode: 201,
        message: RETURN_MESSAGES.SUCCESS.REGISTER_MENTEE,
        data: {
          auth: data,
          user: this.sanitize(mentee, ['hashPassword'])
        }
      }
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        statusCode: 500,
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
      const hashPassword = await bcrypt.hash(dto.password, 10);
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
            timezone: dto.timezone ?? null,
            phoneNumber: dto.phoneNumber ?? null,
            hashPassword: hashPassword,
            role: UserRole.mentor,
            status: UserStatus.pending_approval,
            createdById: authId,
            updatedById: authId
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

  private sanitize<T extends object>(obj: T, fieldsToRemove: (keyof T)[]): Partial<T> {
    const sanitized = { ...obj };
    for (const field of fieldsToRemove) {
      delete sanitized[field];
    }
    return sanitized;
  }
}
