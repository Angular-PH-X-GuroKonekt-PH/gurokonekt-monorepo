import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BUCKET_NAMES, RETURN_MESSAGES } from '@gurokonekt/models/constants';
import { ResendEmailChangeEmail, ResendEmailSignUpConfirmation, SignInInputInterface, SignInWithOAth, SignUpInputInterface, UpdateEmailForAnAuthenticatedUser, UpdatePasswordForAnAuthenticatedUser } from '@gurokonekt/models';
import { RegisterMenteeDto } from '../dto/auth/register-mentee.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LogsActionType, UserRole, UserStatus } from '@prisma/client';
import { RegisterMentorDto } from '../dto/auth/register-mentor.dto';
import bcrypt from "bcrypt";
import { SignInDto } from '../dto/auth';
import { UtilsService } from '../../common/utils/utils.service';

import { ResponseDto } from '@gurokonekt/be-models';
import { ResponseStatus } from '@gurokonekt/models';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      this.logger.error(RETURN_MESSAGES.FAILURE.SUPABASE_CREDENTIALS_NOT_FOUND);
      throw new Error(RETURN_MESSAGES.FAILURE.SUPABASE_CREDENTIALS_NOT_FOUND);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
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
  async registerMentee(dto: RegisterMenteeDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      // Check if user already exists in DB
      const existingUser = await this.prisma.db.user.findUnique({
        where: { email: dto.email }
      });

      if (existingUser) {
        return {
          status: ResponseStatus.Error,
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
          status: ResponseStatus.Error,
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
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
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
        status: ResponseStatus.Success,
        statusCode: 201,
        message: RETURN_MESSAGES.SUCCESS.REGISTER_MENTEE,
        data: {
          auth: data,
          user: this.sanitize(mentee, ['hashPassword'])
        }
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.REGISTER_MENTEE,
        data: error
      }
    }
  }

  // register mentor
  /**
   * Flow: 
   * 1. check if user exist in user table
   * 2. if exist return error else continue
   * 3. check if required fields are present
   * 4. if missing return error else continue
   * 5. check fields are valid:
   *  - email format
   *  - valid phone number and unique with pattern +[country code][number]
   *  - enters a valid Password (min 8 chars, must include uppercase + number + special character)
   *  - enters a valid Confirm Password (must match)
   *  - selects a valid Country
   *  - selects a valid Timezone
   *  - can optionally select Preferred Language (with default English)
   *  - can select multiple Areas of expertise (must select at least one)
   *  - enters Years of Expertise
   *  - enters LinkedIn Profile URL (optional)
   *  - Uploads verification documents (accepts pdf & image format only, max. 10MB)
   *  - checks the Accept Terms & Conditions (checkbox)
   * 6. if invalid return error else continue
   * 7. register mentor in auth and user and MentorProfile table with user status pending_approval
   * 8. uploaded file to 'mentor_documents' bucket in supabase storage
   * 9. save the data to the DocumentAttachment table 
   * 10. if error occured, return error else return success with status 200
   * */ 
  async registerMentor(dto: RegisterMentorDto, files: Express.Multer.File[], ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.db.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        return {
          status: ResponseStatus.Error,
          statusCode: 409,
          message: RETURN_MESSAGES.FAILURE.USER_ALREADY_EXISTS,
          data: null,
        };
      }

      const { data, error } = await this.supabase.auth.signUp({
        email: dto.email,
        password: dto.password
      });   

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
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
            language: dto.language ?? 'en',
            timezone: dto.timezone,
            phoneNumber: dto.phoneNumber,
            hashPassword: hashPassword,
            role: UserRole.mentor,
            status: UserStatus.pending_approval,
            createdById: authId,
            updatedById: authId
          },
          select: this.utilsService.getUserCredentialsSelect()
        });

        const mentorProfile = await tx.mentorProfile.create({
          data: {
            userId: authId,
            areasOfExpertise: dto.areasOfExpertise,
            yearsOfExperience: dto.yearsOfExperience ?? null,
            linkedInUrl: dto.linkedInUrl ?? null,
            skills: [],
            availability: [],
            updatedById: authId
          },
          select: this.utilsService.getMentorProfileSelect()
        });

        for (const file of files) {
          const fileExt = file.originalname.split('.').pop();
          const filePath = `mentors/${authId}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await this.supabaseAdmin.storage
            .from(BUCKET_NAMES.MENTOR_DOCUMENTS)
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrl } = this.supabase.storage
            .from(BUCKET_NAMES.MENTOR_DOCUMENTS)
            .getPublicUrl(filePath);

          await tx.documentAttachment.create({
            data: {
              userId: authId,
              bucketName: BUCKET_NAMES.MENTOR_DOCUMENTS,
              storagePath: filePath,
              publicUrl: publicUrl.publicUrl,
              fileType: file.mimetype,
              fileSize: file.size,
              fileName: file.originalname,
            },
          });
        }

        await tx.logs.create({
          data: {
            actionType: LogsActionType.signup,
            targetId: mentor.id,
            details: `Mentor registration submitted for approval`,
            metadata: {
              role: UserRole.mentor,
              areasOfExpertise: dto.areasOfExpertise,
            },
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            createdById: mentor.id,
          },
        });

        return { user: mentor, profile: mentorProfile };
      });
      
      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.REGISTER_MENTOR,
        data: {
          session: data.session,
          user: transaction.profile
        }
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.REGISTER_MENTOR,
        data: error
      }
    }
  }

  /**
   * Flow:
   * 1. check if request > 3 times in a day from the same ip or email
   * 2. if true return 429 else continue
   * 3. check if request duration < 60s from the last request
   * 4. if true return 429 else continue
   * 5. check if user exist in users db
   * 6. if not exist return error else continue
   * 7. check if user is already confirmed
   * 8. if confirmed return error else send confirmation email
   * 9. save the activity to logs
   * */ 
  async resendEmailSignUpConfirmation(input: ResendEmailSignUpConfirmation, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const MAX_ATTEMPTS_PER_DAY = 3;
      const MIN_INTERVAL_SECONDS = 60;

      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Count resend attempts today by email and IP
      const attemptsTodayByEmail = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.resend_email_confirmation,
          metadata: { path: ['email'], equals: input.email },
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      const attemptsTodayByIp = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.resend_email_confirmation,
          ipAddress,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (attemptsTodayByEmail >= MAX_ATTEMPTS_PER_DAY || attemptsTodayByIp >= MAX_ATTEMPTS_PER_DAY) {
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.resend_email_confirmation,
            targetId: "",
            details: RETURN_MESSAGES.FAILURE.TOO_MANY_REQUESTS,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: null
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: 429,
          message: RETURN_MESSAGES.FAILURE.TOO_MANY_REQUESTS,
          data: null,
        };
      }

      // Check last attempt time
      const lastAttempt = await this.prisma.db.logs.findFirst({
        where: {
          actionType: LogsActionType.resend_email_confirmation,
          metadata: { path: ['email'], equals: input.email },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastAttempt) {
        const secondsSinceLast = (Date.now() - lastAttempt.createdAt.getTime()) / 1000;
        if (secondsSinceLast < MIN_INTERVAL_SECONDS) {
          return {
            status: ResponseStatus.Error,
            statusCode: 429,
            message: `Please wait ${Math.ceil(MIN_INTERVAL_SECONDS - secondsSinceLast)} seconds before trying again.`,
            data: null,
          };
        }
      }

      // Check user in DB
      const user = await this.prisma.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: 404,
          message: RETURN_MESSAGES.FAILURE.USER_NOT_FOUND,
          data: input,
        };
      }

      const { data: userData, error: fetchError } = await this.supabaseAdmin.auth.admin.getUserById(user.id);
      
      if (fetchError || !userData) {
        return {
          status: ResponseStatus.Error,
          statusCode: 404,
          message: RETURN_MESSAGES.FAILURE.USER_NOT_FOUND,
          data: fetchError,
        };
      }

      // Check if email is already confirmed
      if (userData.user.email_confirmed_at) {
        return {
          status: ResponseStatus.Error,
          statusCode: 400,
          message: RETURN_MESSAGES.FAILURE.EMAIL_ALREADY_CONFIRMED,
          data: null,
        };
      }

      // Resend email via Supabase
      const { data, error } = await this.supabase.auth.resend({
        type: 'signup',
        email: input.email,
        ...(input.options
          ? {
              options: {
                emailRedirectTo: input.options.emailRedirectTo || RETURN_MESSAGES.LINKS.DEFAULT_REDIRECT_URL,
              },
            }
          : {}),
      });

      // Log the attempt
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.resend_email_confirmation,
          targetId: user.id,
          details: error
            ? RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR
            : RETURN_MESSAGES.SUCCESS.EMAIL_SENT,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
          createdById: user.id,
        },
      });

      if (error) {
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.EMAIL_SENT,
        data: data || true,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error,
      };
    }
  }

  async resendEmailChangeEmail(input: ResendEmailChangeEmail): Promise<ResponseDto> {
    try {
      const { data, error } = await this.supabase.auth.resend({
        type: 'email_change',
        email: input.email
      });  

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.EMAIL_SENT,
        data: data || true
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async signInWithOAuth(input: SignInWithOAth): Promise<ResponseDto> {
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
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: ResponseStatus.Success,
        statusCode: 201,
        message: RETURN_MESSAGES.SUCCESS.SIGN_UP_SUCCESS,
        data: data
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  /**
   * Flow:
   * 1. check if failed attempts > 3 then return 429
   * 2. check user if exist in db if false return 401
   * 3. check if user credentials are valid if false return 401
   * 4. check if user email is verified if false then return 403
   * 5. if all checks passed return success with status 200
   * */ 
  async signInWithPassword(input: SignInDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);
      const MAX_ATTEMPTS = 3;

      const failedMessages = [
        RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_INVALID_CREDENTIALS,
        RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED,
        RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_USER_NOT_FOUND,
        RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS
      ]

      // Check failed attempts in logs
      const failedByEmail = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.signin,
          metadata: { path: ['email'], equals: input.email },
          createdAt: { gte: todayStart, lte: todayEnd },
          OR: failedMessages.map(message => ({
            details: { contains: message, mode: 'insensitive' },
          })),
        },
      });

      const failedByIp = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.signin,
          ipAddress,
          createdAt: { gte: todayStart, lte: todayEnd },
          OR: failedMessages.map(message => ({
            details: { contains: message, mode: 'insensitive' },
          })),
        },
      });

      if (failedByEmail >= MAX_ATTEMPTS || failedByIp >= MAX_ATTEMPTS) {
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.signin,
            targetId: "",
            details: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: null
          }
        });
        
        return {
          status: ResponseStatus.Error,
          statusCode: 429,
          message: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS,
          data: null
        };
      }

      // Check if user exists
      const user = await this.prisma.db.user.findUnique({
        where: { email: input.email }
      });

      if (!user) {
        // log failed attempt
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.signin,
            targetId: "",
            details: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_USER_NOT_FOUND,
            metadata: { email: input.email },
            ipAddress,
            userAgent
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: 401,
          message: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_INVALID_CREDENTIALS,
          data: null
        };
      }

      // Attempt login via Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });

      if (error || !data.user) {
        // Check if email verified
        if (error && error.code === 'email_not_confirmed') {
          await this.prisma.db.logs.create({
            data: {
              actionType: LogsActionType.signin,
              targetId: user.id,
              details: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED,
              metadata: { email: input.email },
              ipAddress,
              userAgent,
              createdById: user.id
            }
          });
        
          return {
            status: ResponseStatus.Error,
            statusCode: 403,
            message: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED,
            data: null
          };
        }

        // log failed attempt
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.signin,
            targetId: user.id,
            details: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_INVALID_CREDENTIALS,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: user.id
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: 401,
          message: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_INVALID_CREDENTIALS,
          data: null
        };
      }

      // Check if email verified
      if (!data.user.email_confirmed_at) {
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.signin,
            targetId: user.id,
            details: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: user.id
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: 403,
          message: RETURN_MESSAGES.FAILURE.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED,
          data: null
        };
      }

      // Log successful login
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.signin,
          targetId: user.id,
          details: RETURN_MESSAGES.SUCCESS.SIGN_IN_SUCCESS,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
          createdById: user.id
        }
      });

      // After successful signin return the user data without sensitive info
      const userData = await this.prisma.db.user.findUnique({
        where: { id: data.user.id },
        select: this.utilsService.getUserCredentialsSelect()
      });

      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.SIGN_IN_SUCCESS,
        data: {
          user: userData,
          session: data.session
        }
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      };
    }
  }

  async updateEmailForAnAuthenticatedUser(input: UpdateEmailForAnAuthenticatedUser): Promise<ResponseDto> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        email: input.email
      });

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }

      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.EMAIL_UPDATED,
        data: data
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async updatePasswordForAnAuthenticatedUser(input: UpdatePasswordForAnAuthenticatedUser): Promise<ResponseDto> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: input.password
      });
      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }
      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.PASSWORD_UPDATED,
        data: data
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async getUserAuth(): Promise<ResponseDto> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }
      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.USER_AUTH_RETRIEVED,
        data: data
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: error
      }
    }
  }

  async signOut(): Promise<ResponseDto> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: 500,
          message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
          data: error
        }
      }
      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: RETURN_MESSAGES.SUCCESS.SIGN_OUT_SUCCESS,
        data: true
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
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
