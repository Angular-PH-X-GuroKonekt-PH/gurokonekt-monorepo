import { Injectable, Logger } from '@nestjs/common';
import { RegisterMenteeDto, RegisterMentorDto, ResendConfirmationEmailDto, ResponseDto, SelectFields, SignInWithOAthDto, SignInWithPasswordDto, UpdatePasswordDto, ForgotPasswordDto, ResetPasswordDto, VerifyResetPinDto } from '@gurokonekt/models';
import { ResponseStatus, API_RESPONSE, RESEND_EMAIL_CONFIRMATION,
  SIGN_IN_WITH_PASSWORD, UPDATE_PASSWORD, UserRole, UserStatus, LogsActionType,
  ResendOTPTypes, REDIRECT_LINKS
} from '@gurokonekt/models';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly storage: StorageService,
  ) {}

  // register mentee
  /**
   * Flow:
   * 1. check if user exist in db
   * 2. if exist return error else continue
   * 3. check if required fields are present (check in dto)
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
        this.logger.error(`${API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message} (${dto.email})`);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message,
          data: null
        };
      }

      // Create user in Supabase Auth
      const { data, error } = await this.supabase.client.auth.signUp({
        email: dto.email,
        password: dto.password
      });   

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: error
        }
      }

      if (!data?.user?.id) {
        this.logger.error(API_RESPONSE.ERROR.NO_DATA_RETURNED_ON_AUTH.message);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.NO_DATA_RETURNED_ON_AUTH.message,
          data: null,
        };
      }

      if (!data.user.identities || data.user.identities.length === 0) {
        this.logger.error(`${API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message} (${dto.email}) — Supabase identity empty`);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message,
          data: null,
        };
      }

      const authId = data.user.id;
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
          language: dto.language,
          timezone: dto.timezone,
          phoneNumber: dto.phoneNumber ?? null,
          hashPassword: hashPassword,
          isProfileComplete: false,
          role: UserRole.Mentee,
          status: UserStatus.Active,
          createdById: authId,
          updatedById: authId
        },
        select: SelectFields.getUserCredentialsSelect()
      });

      // save activity to logs
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.SignUp,
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
        statusCode: API_RESPONSE.SUCCESS.REGISTER_MENTEE.code,
        message: API_RESPONSE.SUCCESS.REGISTER_MENTEE.message,
        data: {
          auth: data,
          user: mentee
        }
      }
    } catch (error) {
      if (error?.code === 'P2002') {
        this.logger.error(`${API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message} (${dto.email}) — DB constraint`);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message,
          data: null,
        };
      }
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.REGISTER_MENTEE.code,
        message: API_RESPONSE.ERROR.REGISTER_MENTEE.message,
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
          statusCode: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message,
          data: null,
        };
      }

      const { data, error } = await this.supabase.client.auth.signUp({
        email: dto.email,
        password: dto.password
      });   

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: error
        }
      }

      if (!data?.user?.id) {
        this.logger.error(API_RESPONSE.ERROR.NO_DATA_RETURNED_ON_AUTH.message);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.NO_DATA_RETURNED_ON_AUTH.message,
          data: null,
        };
      }

      if (!data.user.identities || data.user.identities.length === 0) {
        this.logger.error(`${API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message} (${dto.email}) — Supabase identity empty`);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message,
          data: null,
        };
      }

      const authId = data.user.id;
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
            role: UserRole.Mentor,
            status: UserStatus.PendingApproval,
            createdById: authId,
            updatedById: authId
          },
          select: SelectFields.getUserCredentialsSelect()
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
          select: SelectFields.getMentorProfileSelect()
        });

        await tx.logs.create({
          data: {
            actionType: LogsActionType.SignUp,
            targetId: mentor.id,
            details: `Mentor registration submitted for approval`,
            metadata: {
              role: UserRole.Mentor,
              areasOfExpertise: dto.areasOfExpertise,
            },
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            createdById: mentor.id,
          },
        });

        return { user: mentor, profile: mentorProfile };
      });

      let uploadResult = null;
      if (files?.length) {
        uploadResult = await this.storage.uploadDocument(
          files,
          authId,
          UserRole.Mentor,
        );
      }
      
      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.REGISTER_MENTOR.code,
        message: API_RESPONSE.SUCCESS.REGISTER_MENTOR.message,
        data: {
          session: data.session,
          user: transaction.profile,
          documents: uploadResult?.data ?? []
        }
      }
    } catch (error) {
      if (error?.code === 'P2002') {
        this.logger.error(`${API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message} (${dto.email}) — DB constraint`);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message,
          data: null,
        };
      }
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.REGISTER_MENTOR.code,
        message: API_RESPONSE.ERROR.REGISTER_MENTOR.message,
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
  async resendEmailSignUpConfirmation(input: ResendConfirmationEmailDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const todayStart = new Date();
      const todayEnd = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Count resend attempts today by email and IP
      const attemptsTodayByEmail = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.ResendEmailConfirmation,
          metadata: { path: ['email'], equals: input.email },
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      const attemptsTodayByIp = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.ResendEmailConfirmation,
          ipAddress,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (attemptsTodayByEmail >= RESEND_EMAIL_CONFIRMATION.MAX_ATTEMPTS_PER_DAY || 
          attemptsTodayByIp >= RESEND_EMAIL_CONFIRMATION.MAX_ATTEMPTS_PER_DAY) {
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.ResendEmailConfirmation,
            targetId: "",
            details: API_RESPONSE.ERROR.TOO_MANY_REQUESTS.message,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: null
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.TOO_MANY_REQUESTS.code,
          message: API_RESPONSE.ERROR.TOO_MANY_REQUESTS.message,
          data: null,
        };
      }

      // Check last attempt time
      const lastAttempt = await this.prisma.db.logs.findFirst({
        where: {
          actionType: LogsActionType.ResendEmailConfirmation,
          metadata: { path: ['email'], equals: input.email },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastAttempt) {
        const secondsSinceLast = (Date.now() - lastAttempt.createdAt.getTime()) / 1000;
        if (secondsSinceLast < RESEND_EMAIL_CONFIRMATION.MIN_INTERVAL_SECONDS) {
          return {
            status: ResponseStatus.Error,
            statusCode: 429,
            message: `Please wait ${Math.ceil(RESEND_EMAIL_CONFIRMATION.MIN_INTERVAL_SECONDS - secondsSinceLast)} seconds before trying again.`,
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
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: input,
        };
      }

      const { data: userData, error: fetchError } = await this.supabase.clientAdmin.auth.admin.getUserById(user.id);
      
      if (fetchError || !userData) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: fetchError,
        };
      }

      // Check if email is already confirmed
      if (userData.user.email_confirmed_at) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.EMAIL_ALREADY_CONFIRMED.code,
          message: API_RESPONSE.ERROR.EMAIL_ALREADY_CONFIRMED.message,
          data: null,
        };
      }

      // Resend email via Supabase
      const { data, error } = await this.supabase.client.auth.resend({
        type: ResendOTPTypes.SignUp,
        email: input.email
      });

      // Log the attempt
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.ResendEmailConfirmation,
          targetId: user.id,
          details: error
            ? API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message
            : API_RESPONSE.SUCCESS.CONFIRMATION_EMAIL_SENT.message,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
          createdById: user.id,
        },
      });

      if (error) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: error,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.CONFIRMATION_EMAIL_SENT.code,
        message: API_RESPONSE.SUCCESS.CONFIRMATION_EMAIL_SENT.message,
        data: data || true,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: error,
      };
    }
  }

  async signInWithOAuth(input: SignInWithOAthDto): Promise<ResponseDto> {
    try {
      const { data, error } = await this.supabase.client.auth.signInWithOAuth({
        provider: input.provider
      });   

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: error
        }
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.SIGN_WITH_OATH.code,
        message: API_RESPONSE.SUCCESS.SIGN_WITH_OATH.message,
        data: data
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
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
  async signInWithPassword(input: SignInWithPasswordDto, ipAddress: string, userAgent: string, origin?: string): Promise<ResponseDto> {
    try {
      const todayStart = new Date();
      const todayEnd = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      todayEnd.setUTCHours(23, 59, 59, 999);

      const failedMessages = [
        API_RESPONSE.ERROR.USER_NOT_FOUND.message,
        API_RESPONSE.ERROR.SIGNIN_ATTEMPT_INVALID_CREDENTIALS.message,
        API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.message,
        API_RESPONSE.ERROR.SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS.message,
      ]

      // Check failed attempts in logs
      const failedByEmail = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.SignIn,
          metadata: { path: ['email'], equals: input.email },
          createdAt: { gte: todayStart, lte: todayEnd },
          OR: failedMessages.map(message => ({
            details: { contains: message, mode: 'insensitive' },
          })),
        },
      });

      const failedByIp = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.SignIn,
          ipAddress,
          createdAt: { gte: todayStart, lte: todayEnd },
          OR: failedMessages.map(message => ({
            details: { contains: message, mode: 'insensitive' },
          })),
        },
      });

      if (failedByEmail >= SIGN_IN_WITH_PASSWORD.MAX_ATTEMPTS_PER_DAY || 
        failedByIp >= SIGN_IN_WITH_PASSWORD.MAX_ATTEMPTS_PER_DAY) {
        
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.SignIn,
            targetId: "",
            details: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS.message,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: null
          }
        });
        
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS.code,
          message: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS.message,
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
            actionType: LogsActionType.SignIn,
            targetId: "",
            details: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
            metadata: { email: input.email },
            ipAddress,
            userAgent
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_INVALID_CREDENTIALS.code,
          message: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_INVALID_CREDENTIALS.message,
          data: null
        };
      }

      // Attempt login via Supabase
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });

      if (error || !data.user) {
        // Check if email verified
        if (error && error.code === 'email_not_confirmed') {
          await this.prisma.db.logs.create({
            data: {
              actionType: LogsActionType.SignIn,
              targetId: user.id,
              details: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.message,
              metadata: { email: input.email },
              ipAddress,
              userAgent,
              createdById: user.id
            }
          });
        
          return {
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.code,
            message: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.message,
            data: null
          };
        }

        // log failed attempt
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.SignIn,
            targetId: user.id,
            details: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_INVALID_CREDENTIALS.message,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: user.id
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_INVALID_CREDENTIALS.code,
          message: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_INVALID_CREDENTIALS.message,
          data: null
        };
      }

      // Check if email verified
      if (!data.user.email_confirmed_at) {
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.SignIn,
            targetId: user.id,
            details: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.message,
            metadata: { email: input.email },
            ipAddress,
            userAgent,
            createdById: user.id
          }
        });

        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.code,
          message: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.message,
          data: null
        };
      }

      // Log successful login
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.SignIn,
          targetId: user.id,
          details: API_RESPONSE.SUCCESS.SIGN_WITH_PASSWORD.message,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
          createdById: user.id
        }
      });

      // After successful signin return the user data without sensitive info
      let userData = await this.prisma.db.user.findUnique({
        where: { id: data.user.id },
        select: SelectFields.getUserCredentialsSelect()
      });

      // Mentee profile is created on profile setup submit. If no profile row exists,
      // force profile completion flag to false to keep onboarding flow consistent.
      if (userData?.role === UserRole.Mentee) {
        const menteeProfile = await this.prisma.db.menteeProfile.findUnique({
          where: { userId: userData.id },
          select: { id: true },
        });

        const effectiveIsProfileComplete = userData.isProfileComplete === true && !!menteeProfile;

        if (userData.isProfileComplete !== effectiveIsProfileComplete) {
          await this.prisma.db.user.update({
            where: { id: userData.id },
            data: { isProfileComplete: effectiveIsProfileComplete },
          });
        }

        userData = {
          ...userData,
          isProfileComplete: effectiveIsProfileComplete,
        };
      }

      const redirectUrl =
        userData?.role === UserRole.Admin && userData?.isProfileComplete === false
          ? `${origin ?? ''}${REDIRECT_LINKS.ADMIN_DASHBOARD}`
          : null;

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.SIGN_WITH_PASSWORD.code,
        message: API_RESPONSE.SUCCESS.SIGN_WITH_PASSWORD.message,
        data: {
          user: userData,
          session: data.session,
          redirectUrl
        }
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: error
      };
    }
  }

  /**
   * Update Password (authenticated Mentee/Mentor)
   * Flow:
   * 1. Check failed attempts (max 3/day) per user
   * 2. Verify user exists
   * 3. Compare currentPassword against stored hash
   * 4. Validate confirmPassword matches newPassword
   * 5. Hash newPassword, update Supabase + DB
   */
  async updatePassword(dto: UpdatePasswordDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const todayStart = new Date();
      const todayEnd = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Rate-limit incorrect current password attempts
      const failedAttempts = await this.prisma.db.logs.count({
        where: {
          actionType: LogsActionType.UpdatePassword,
          metadata: { path: ['userId'], equals: dto.userId },
          details: { contains: API_RESPONSE.ERROR.PASSWORD_INCORRECT.message, mode: 'insensitive' },
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (failedAttempts >= UPDATE_PASSWORD.MAX_INCORRECT_ATTEMPTS_PER_DAY) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.UPDATE_PASSWORD_TOO_MANY_ATTEMPTS.code,
          message: API_RESPONSE.ERROR.UPDATE_PASSWORD_TOO_MANY_ATTEMPTS.message,
          data: null,
        };
      }

      const user = await this.prisma.db.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.hashPassword);

      if (!isCurrentPasswordValid) {
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.UpdatePassword,
            targetId: user.id,
            details: API_RESPONSE.ERROR.PASSWORD_INCORRECT.message,
            metadata: { userId: dto.userId },
            ipAddress,
            userAgent,
            createdById: user.id,
          },
        });

        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_INCORRECT.code,
          message: API_RESPONSE.ERROR.PASSWORD_INCORRECT.message,
          data: null,
        };
      }

      // Validate confirmPassword matches newPassword
      if (dto.newPassword !== dto.confirmPassword) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_MISMATCH.code,
          message: API_RESPONSE.ERROR.PASSWORD_MISMATCH.message,
          data: null,
        };
      }

      const newHashPassword = await bcrypt.hash(dto.newPassword, 10);

      // Update password in Supabase
      const { error: supabaseError } = await this.supabase.clientAdmin.auth.admin.updateUserById(
        user.id,
        { password: dto.newPassword },
      );

      if (supabaseError) {
        this.logger.error(supabaseError.message, supabaseError.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: supabaseError,
        };
      }

      // Update hashed password in DB
      await this.prisma.db.user.update({
        where: { id: user.id },
        data: { hashPassword: newHashPassword },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.UpdatePassword,
          targetId: user.id,
          details: API_RESPONSE.SUCCESS.UPDATE_PASSWORD.message,
          metadata: { userId: dto.userId },
          ipAddress,
          userAgent,
          createdById: user.id,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPDATE_PASSWORD.code,
        message: API_RESPONSE.SUCCESS.UPDATE_PASSWORD.message,
        data: null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.UPDATE_PASSWORD.code,
        message: API_RESPONSE.ERROR.UPDATE_PASSWORD.message,
        data: error,
      };
    }
  }

  /**
   * Forgot Password — sends a secure reset link to the user's email.
   * Flow:
   * 1. Verify email exists in DB
   * 2. Send password reset link via Supabase (redirects to frontend reset page)
   */
  async forgotPassword(dto: ForgotPasswordDto, ipAddress: string, userAgent: string, origin?: string): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      const redirectTo = `${origin ?? ''}${REDIRECT_LINKS.RESET_PASSWORD}`;

      const { error } = await this.supabase.client.auth.resetPasswordForEmail(dto.email, {
        redirectTo,
      });

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: error,
        };
      }

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.ForgotPassword,
          targetId: user.id,
          details: API_RESPONSE.SUCCESS.FORGOT_PASSWORD_EMAIL_SENT.message,
          metadata: { email: dto.email },
          ipAddress,
          userAgent,
          createdById: user.id,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.FORGOT_PASSWORD_EMAIL_SENT.code,
        message: API_RESPONSE.SUCCESS.FORGOT_PASSWORD_EMAIL_SENT.message,
        data: null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.RESET_PASSWORD.code,
        message: API_RESPONSE.ERROR.RESET_PASSWORD.message,
        data: error,
      };
    }
  }

  /**
   * Reset Password — validates the new password then sends a PIN to the user's email.
   * Called after the user clicks the reset link and fills in the new password form.
   * Flow:
   * 1. Validate confirmPassword matches newPassword
   * 2. Verify email exists in DB
   * 3. Send 6-digit OTP (PIN) via Supabase signInWithOtp
   */
  async resetPassword(dto: ResetPasswordDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      if (dto.newPassword !== dto.confirmPassword) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_MISMATCH.code,
          message: API_RESPONSE.ERROR.PASSWORD_MISMATCH.message,
          data: null,
        };
      }

      const user = await this.prisma.db.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      // Send OTP as PIN via Supabase (valid per Supabase OTP expiry, capped at 20 min in verifyResetPin)
      const { error } = await this.supabase.client.auth.signInWithOtp({
        email: dto.email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: error,
        };
      }

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.ResetPassword,
          targetId: user.id,
          details: API_RESPONSE.SUCCESS.RESET_PASSWORD_PIN_SENT.message,
          metadata: { email: dto.email },
          ipAddress,
          userAgent,
          createdById: user.id,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.RESET_PASSWORD_PIN_SENT.code,
        message: API_RESPONSE.SUCCESS.RESET_PASSWORD_PIN_SENT.message,
        data: null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.RESET_PASSWORD.code,
        message: API_RESPONSE.ERROR.RESET_PASSWORD.message,
        data: error,
      };
    }
  }

  /**
   * Verify Reset PIN — validates the PIN (OTP) and updates the password.
   * Flow:
   * 1. Validate confirmPassword matches newPassword
   * 2. Verify OTP via Supabase verifyOtp
   * 3. Check the PIN was issued within the last 20 minutes (via Logs)
   * 4. Hash newPassword, update Supabase + DB
   */
  async verifyResetPin(dto: VerifyResetPinDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      if (dto.newPassword !== dto.confirmPassword) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_MISMATCH.code,
          message: API_RESPONSE.ERROR.PASSWORD_MISMATCH.message,
          data: null,
        };
      }

      // Verify OTP issued by resetPassword step
      const { data, error } = await this.supabase.client.auth.verifyOtp({
        email: dto.email,
        token: dto.pin,
        type: 'email',
      });

      if (error || !data.user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.RESET_PIN_INVALID.code,
          message: API_RESPONSE.ERROR.RESET_PIN_INVALID.message,
          data: null,
        };
      }

      // Enforce 20-minute expiry via the ResetPassword log entry
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      const recentResetLog = await this.prisma.db.logs.findFirst({
        where: {
          actionType: LogsActionType.ResetPassword,
          metadata: { path: ['email'], equals: dto.email },
          createdAt: { gte: twentyMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!recentResetLog) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.RESET_PIN_INVALID.code,
          message: API_RESPONSE.ERROR.RESET_PIN_INVALID.message,
          data: null,
        };
      }

      const newHashPassword = await bcrypt.hash(dto.newPassword, 10);

      // Update password in Supabase
      const { error: updateError } = await this.supabase.clientAdmin.auth.admin.updateUserById(
        data.user.id,
        { password: dto.newPassword },
      );

      if (updateError) {
        this.logger.error(updateError.message, updateError.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: updateError,
        };
      }

      // Update hashed password in DB
      await this.prisma.db.user.update({
        where: { id: data.user.id },
        data: { hashPassword: newHashPassword },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.VerifyResetPin,
          targetId: data.user.id,
          details: API_RESPONSE.SUCCESS.UPDATE_PASSWORD.message,
          metadata: { email: dto.email },
          ipAddress,
          userAgent,
          createdById: data.user.id,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPDATE_PASSWORD.code,
        message: API_RESPONSE.SUCCESS.UPDATE_PASSWORD.message,
        data: null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.RESET_PASSWORD.code,
        message: API_RESPONSE.ERROR.RESET_PASSWORD.message,
        data: error,
      };
    }
  }

  async signOut(): Promise<ResponseDto> {
    try {
      const { error } = await this.supabase.client.auth.signOut();
      if (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: error
        }
      }
      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.SIGN_OUT.code,
        message: API_RESPONSE.SUCCESS.SIGN_OUT.message,
        data: true
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: error
      }
    }
  }
}
