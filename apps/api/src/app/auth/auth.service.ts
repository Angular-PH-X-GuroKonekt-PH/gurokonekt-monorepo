import { Injectable, Logger } from '@nestjs/common';
import { RegisterMenteeDto, RegisterMentorDto, ResendConfirmationEmailDto, ResponseDto, SelectFields, SignInWithOAthDto, SignInWithPasswordDto, UpdatePasswordDto, ForgotPasswordDto, CompletePasswordResetDto, ResetPasswordDto, VerifyResetPinDto, VerifyPasswordChangeDto, RefreshTokenDto } from '@gurokonekt/models';
import { ResponseStatus, API_RESPONSE, RESEND_EMAIL_CONFIRMATION, UserRole, UserStatus, LogsActionType,
  ResendOTPTypes, REDIRECT_LINKS
} from '@gurokonekt/models';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  AuthResponseFactory,
  AuthValidationService,
  AuthLoggingService,
  AuthRateLimiterService,
  AuthErrorHandlerService,
  AUTH_RATE_LIMITS,
  withVerificationEmailQuery,
} from './helpers';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly storage: StorageService,
    private readonly validation: AuthValidationService,
    private readonly logging: AuthLoggingService,
    private readonly rateLimiter: AuthRateLimiterService,
    private readonly errorHandler: AuthErrorHandlerService,
  ) {}

  /**
   * Register Mentee - Simplified with helper services
   * Uses enterprise patterns: Factory, Validation, Logging, Error Handling
   */
  async registerMentee(dto: RegisterMenteeDto, ipAddress: string, userAgent: string, origin?: string): Promise<ResponseDto> {
    try {
      const normalizedEmail = this.validation.normalizeEmail(dto.email);

      // Check if user already exists
      if (await this.validation.userExists(normalizedEmail)) {
        return AuthResponseFactory.errorByKey('USER_ALREADY_EXISTS');
      }

      // Create user in Supabase Auth
      const emailRedirectTo = withVerificationEmailQuery(
        dto.emailRedirectTo ?? `${origin ?? ''}${REDIRECT_LINKS.VERIFY_EMAIL}`,
        normalizedEmail
      );
      const { data, error } = await this.supabase.client.auth.signUp({
        email: normalizedEmail,
        password: dto.password,
        options: { emailRedirectTo },
      });

      if (error || !data?.user?.id) {
        return error
          ? this.errorHandler.handleSupabaseError(error)
          : AuthResponseFactory.errorByKey('NO_DATA_RETURNED_ON_AUTH');
      }

      // Create mentee in DB
      const authId = data.user.id;
      const hashPassword = await this.validation.hashPassword(dto.password);

      const mentee = await this.prisma.db.user.create({
        data: {
          id: authId,
          firstName: dto.firstName,
          middleName: dto.middleName ?? null,
          lastName: dto.lastName,
          suffix: dto.suffix ?? null,
          email: normalizedEmail,
          country: dto.country,
          language: dto.language,
          timezone: dto.timezone,
          phoneNumber: dto.phoneNumber ?? null,
          hashPassword,
          role: UserRole.Mentee,
          status: UserStatus.Active,
          createdById: authId,
          updatedById: authId,
        },
        select: SelectFields.getUserCredentialsSelect(),
      });

      // Log signup activity
      await this.logging.log({
        actionType: LogsActionType.SignUp,
        targetId: mentee.id,
        details: `Mentee account registered with email: ${mentee.email}`,
        metadata: { role: mentee.role },
        ipAddress,
        userAgent,
        createdById: mentee.id,
      });

      return AuthResponseFactory.successByKey('REGISTER_MENTEE', { auth: data, user: mentee });
    } catch (error) {
      return this.errorHandler.handleDatabaseError(error);
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
  async registerMentor(dto: RegisterMentorDto, files: Express.Multer.File[], ipAddress: string, userAgent: string, origin?: string): Promise<ResponseDto> {
    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = dto.email.toLowerCase().trim();

    try {
      // Check if user already exists
      if (await this.validation.userExists(normalizedEmail)) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message,
          data: null,
        };
      }

      const emailRedirectTo = withVerificationEmailQuery(
        dto.emailRedirectTo ?? `${origin ?? ''}${REDIRECT_LINKS.VERIFY_EMAIL}`,
        normalizedEmail
      );
      const { data, error } = await this.supabase.client.auth.signUp({
        email: normalizedEmail,
        password: dto.password,
        options: { emailRedirectTo },
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
            email: normalizedEmail,
            country: dto.country,
            language: dto.language ?? 'en',
            timezone: dto.timezone,
            phoneNumber: dto.phoneNumber,
            hashPassword: hashPassword,
            role: UserRole.Mentor,
            status: UserStatus.PendingApproval,
            isMentorProfileComplete: false,
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
    } catch (error: any) {
      if (error?.code === 'P2002') {
        this.logger.error(`${API_RESPONSE.ERROR.USER_ALREADY_EXISTS.message} (${normalizedEmail}) — DB constraint`);
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
  async resendEmailSignUpConfirmation(input: ResendConfirmationEmailDto, ipAddress: string, userAgent: string, origin?: string): Promise<ResponseDto> {
    try {
      if (process.env.NODE_ENV !== 'test') {
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
              details: API_RESPONSE.ERROR.RESEND_VERIFICATION_LIMIT_REACHED.message,
              metadata: { email: input.email },
              ipAddress,
              userAgent,
              createdById: null
            }
          });

          return {
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.RESEND_VERIFICATION_LIMIT_REACHED.code,
            message: API_RESPONSE.ERROR.RESEND_VERIFICATION_LIMIT_REACHED.message,
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
            const waitSeconds = Math.ceil(
              RESEND_EMAIL_CONFIRMATION.MIN_INTERVAL_SECONDS - secondsSinceLast
            );
            return {
              status: ResponseStatus.Error,
              statusCode: API_RESPONSE.ERROR.RESEND_VERIFICATION_TOO_SOON.code,
              message: `Please wait ${waitSeconds} seconds before requesting another verification email.`,
              data: null,
            };
          }
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
      const emailRedirectTo = withVerificationEmailQuery(
        input.emailRedirectTo ?? `${origin ?? ''}${REDIRECT_LINKS.VERIFY_EMAIL}`,
        input.email
      );
      const { data, error } = await this.supabase.client.auth.resend({
        type: ResendOTPTypes.SignUp,
        email: input.email,
        options: { emailRedirectTo },
      });

      // Log the attempt
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.ResendEmailConfirmation,
          targetId: user.id,
          details: error
            ? this.isSupabaseEmailRateLimitError(error)
              ? API_RESPONSE.ERROR.RESEND_VERIFICATION_RATE_LIMITED.message
              : API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message
            : API_RESPONSE.SUCCESS.CONFIRMATION_EMAIL_SENT.message,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
          createdById: user.id,
        },
      });

      if (error) {
        if (this.isSupabaseEmailRateLimitError(error)) {
          return {
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.RESEND_VERIFICATION_RATE_LIMITED.code,
            message: API_RESPONSE.ERROR.RESEND_VERIFICATION_RATE_LIMITED.message,
            data: error,
          };
        }

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
    } catch (error: any) {
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
    } catch (error: any) {
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
   * Sign In with Password - Simplified with enterprise services
   * Uses rate limiting, validation, and logging helpers
   */
  async signInWithPassword(input: SignInWithPasswordDto, ipAddress: string, userAgent: string, origin?: string): Promise<ResponseDto> {
    try {
      // Rate limit check
      if (process.env.NODE_ENV !== 'test') {
        const rateLimitError = await this.rateLimiter.checkRateLimit(
          {
            actionType: LogsActionType.SignIn,
            maxAttempts: AUTH_RATE_LIMITS.SIGN_IN.maxAttemptsPerDay,
            timeWindowMs: AUTH_RATE_LIMITS.SIGN_IN.timeWindowMs,
            errorKey: 'SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS',
          },
          input.email
        );
        if (rateLimitError) return rateLimitError;
      }

      // Validate user exists
      const user = await this.validation.getUserByEmail(input.email);
      if (!user) {
        await this.logging.log({
          actionType: LogsActionType.SignIn,
          targetId: '',
          details: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
        });
        return AuthResponseFactory.errorByKey('SIGNIN_ATTEMPT_INVALID_CREDENTIALS');
      }

      // Attempt Supabase login
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error?.code === 'email_not_confirmed' || !data?.user?.email_confirmed_at) {
        await this.logging.log({
          actionType: LogsActionType.SignIn,
          targetId: user.id,
          details: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED.message,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
          createdById: user.id,
        });
        return AuthResponseFactory.errorByKey('SIGNIN_ATTEMPT_EMAIL_NOT_VERIFIED');
      }

      if (error || !data?.user) {
        await this.logging.log({
          actionType: LogsActionType.SignIn,
          targetId: user.id,
          details: API_RESPONSE.ERROR.SIGNIN_ATTEMPT_INVALID_CREDENTIALS.message,
          metadata: { email: input.email },
          ipAddress,
          userAgent,
          createdById: user.id,
        });
        return AuthResponseFactory.errorByKey('SIGNIN_ATTEMPT_INVALID_CREDENTIALS');
      }

      // Sync mentee profile completion state
      let userData = await this.prisma.db.user.findUnique({
        where: { id: data.user.id },
        select: SelectFields.getUserCredentialsSelect(),
      });

      // Gate mentor sign-in on approval status. Pending mentors are still under
      // review; rejected mentors are not permitted to sign in. Approved mentors
      // continue through the normal flow.
      if (userData?.role === UserRole.Mentor) {
        if (
          userData.status === UserStatus.PendingApproval ||
          userData.status === UserStatus.PendingReview
        ) {
          await this.logging.log({
            actionType: LogsActionType.SignIn,
            targetId: user.id,
            details: API_RESPONSE.ERROR.SIGNIN_MENTOR_PENDING_REVIEW.message,
            metadata: { email: input.email, status: userData.status },
            ipAddress,
            userAgent,
            createdById: user.id,
          });
          return AuthResponseFactory.errorByKey('SIGNIN_MENTOR_PENDING_REVIEW');
        }

        if (userData.status === UserStatus.Rejected) {
          await this.logging.log({
            actionType: LogsActionType.SignIn,
            targetId: user.id,
            details: API_RESPONSE.ERROR.SIGNIN_MENTOR_REJECTED.message,
            metadata: { email: input.email, status: userData.status },
            ipAddress,
            userAgent,
            createdById: user.id,
          });
          return AuthResponseFactory.errorByKey('SIGNIN_MENTOR_REJECTED');
        }
      }

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
          userData = { ...userData, isProfileComplete: effectiveIsProfileComplete };
        }
      }

      // Log successful login
      await this.logging.log({
        actionType: LogsActionType.SignIn,
        targetId: user.id,
        details: API_RESPONSE.SUCCESS.SIGN_WITH_PASSWORD.message,
        metadata: { email: input.email },
        ipAddress,
        userAgent,
        createdById: user.id,
      });

      const redirectUrl =
        userData?.role === UserRole.Admin && !userData?.isProfileComplete
          ? `${origin ?? ''}${REDIRECT_LINKS.ADMIN_DASHBOARD}`
          : null;

      return AuthResponseFactory.successByKey('SIGN_WITH_PASSWORD', {
        user: userData,
        session: data.session,
        redirectUrl,
      });
    } catch (error) {
      return this.errorHandler.handleUnexpectedError(error, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Refresh access token using a Supabase refresh token.
   * Each successful refresh invalidates the previous refresh token.
   */
  async refreshToken(input: RefreshTokenDto): Promise<ResponseDto> {
    try {
      const { data, error } = await this.supabase.client.auth.refreshSession({
        refresh_token: input.refreshToken,
      });

      if (error || !data.session?.access_token || !data.session?.refresh_token) {
        return AuthResponseFactory.errorByKey('REFRESH_TOKEN_INVALID');
      }

      return AuthResponseFactory.successByKey('REFRESH_TOKEN', {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    } catch (error) {
      return this.errorHandler.handleUnexpectedError(error, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Update Password (authenticated Mentee/Mentor) - Simplified
   * Uses rate limiting and validation helpers
   */
  async updatePassword(dto: UpdatePasswordDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      // Rate limit incorrect password attempts
      if (process.env.NODE_ENV !== 'test') {
        const rateLimitError = await this.rateLimiter.checkRateLimit(
          {
            actionType: LogsActionType.UpdatePassword,
            maxAttempts: AUTH_RATE_LIMITS.UPDATE_PASSWORD.maxIncorrectAttemptsPerDay,
            timeWindowMs: 86400000,
            errorKey: 'UPDATE_PASSWORD_TOO_MANY_ATTEMPTS',
          },
          dto.userId,
          'userId'
        );
        if (rateLimitError) return rateLimitError;
      }

      // Validate user exists
      const user = await this.prisma.db.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, email: true, hashPassword: true },
      });
      if (!user) return AuthResponseFactory.errorByKey('USER_NOT_FOUND');

      // Verify current password
      const isValid = await this.validation.validatePassword(dto.currentPassword, user.hashPassword);
      if (!isValid) {
        await this.logging.log({
          actionType: LogsActionType.UpdatePassword,
          targetId: user.id,
          details: API_RESPONSE.ERROR.PASSWORD_INCORRECT.message,
          metadata: { userId: dto.userId },
          ipAddress,
          userAgent,
          createdById: user.id,
        });
        return AuthResponseFactory.errorByKey('PASSWORD_INCORRECT');
      }

      // Validate passwords match
      if (!this.validation.validatePasswordMatch(dto.newPassword, dto.confirmPassword)) {
        return AuthResponseFactory.errorByKey('PASSWORD_MISMATCH');
      }

      const pendingHashPassword = await this.validation.hashPassword(dto.newPassword);
      await this.prisma.db.user.update({
        where: { id: user.id },
        data: { pendingHashPassword, pendingPasswordChangeAt: new Date() },
      });

      // Send OTP via Supabase
      const { error: otpError } = await this.supabase.client.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      });

      if (otpError) {
        await this.prisma.db.user.update({
          where: { id: user.id },
          data: { pendingHashPassword: null, pendingPasswordChangeAt: null },
        });
        return this.errorHandler.handleSupabaseError(otpError);
      }

      return AuthResponseFactory.successByKey('INITIATE_PASSWORD_CHANGE');
    } catch (error) {
      return this.errorHandler.handleUnexpectedError(error, 'UPDATE_PASSWORD');
    }
  }

  async verifyPasswordChange(dto: VerifyPasswordChangeDto, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, email: true, pendingHashPassword: true, pendingPasswordChangeAt: true },
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      if (!user.pendingHashPassword || !user.pendingPasswordChangeAt) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_CHANGE_TOKEN_INVALID.code,
          message: API_RESPONSE.ERROR.PASSWORD_CHANGE_TOKEN_INVALID.message,
          data: null,
        };
      }

      // Enforce 15-minute expiry
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (user.pendingPasswordChangeAt < fifteenMinutesAgo) {
        await this.prisma.db.user.update({
          where: { id: user.id },
          data: { pendingHashPassword: null, pendingPasswordChangeAt: null },
        });
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_CHANGE_TOKEN_EXPIRED.code,
          message: API_RESPONSE.ERROR.PASSWORD_CHANGE_TOKEN_EXPIRED.message,
          data: null,
        };
      }

      // Verify Supabase OTP
      const { error: otpError } = await this.supabase.client.auth.verifyOtp({
        email: user.email,
        token: dto.pin,
        type: 'email',
      });

      if (otpError) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_CHANGE_TOKEN_INVALID.code,
          message: API_RESPONSE.ERROR.PASSWORD_CHANGE_TOKEN_INVALID.message,
          data: null,
        };
      }

      // Verify newPassword matches the pending hash (tamper-prevention)
      const isPasswordMatch = await bcrypt.compare(dto.newPassword, user.pendingHashPassword);
      if (!isPasswordMatch) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_MISMATCH.code,
          message: API_RESPONSE.ERROR.PASSWORD_MISMATCH.message,
          data: null,
        };
      }

      // Apply to Supabase Auth
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

      // Apply to DB and clear pending fields
      await this.prisma.db.user.update({
        where: { id: user.id },
        data: {
          hashPassword: user.pendingHashPassword,
          pendingHashPassword: null,
          pendingPasswordChangeAt: null,
        },
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
    } catch (error: any) {
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
    } catch (error: any) {
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
   * Completes a password reset using the recovery access token issued by Supabase.
   * The token proves access to the reset email, so no additional PIN is required.
   */
  async completePasswordReset(
    dto: CompletePasswordResetDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    try {
      if (dto.newPassword !== dto.confirmPassword) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_MISMATCH.code,
          message: API_RESPONSE.ERROR.PASSWORD_MISMATCH.message,
          data: null,
        };
      }

      const { data, error } = await this.supabase.client.auth.getUser(dto.accessToken);

      if (error || !data.user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.RESET_PASSWORD.code,
          message: 'The password reset link is invalid or has expired.',
          data: null,
        };
      }

      const user = await this.prisma.db.user.findUnique({
        where: { id: data.user.id },
        select: { id: true },
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      const { error: updateError } =
        await this.supabase.clientAdmin.auth.admin.updateUserById(data.user.id, {
          password: dto.newPassword,
        });

      if (updateError) {
        this.logger.error(updateError.message, updateError.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
          message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
          data: null,
        };
      }

      const hashPassword = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.db.user.update({
        where: { id: data.user.id },
        data: { hashPassword },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.ResetPassword,
          targetId: data.user.id,
          details: API_RESPONSE.SUCCESS.UPDATE_PASSWORD.message,
          metadata: { email: data.user.email },
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
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.RESET_PASSWORD.code,
        message: API_RESPONSE.ERROR.RESET_PASSWORD.message,
        data: null,
      };
    }
  }

  /**
   * Legacy PIN flow: validates the new password then sends a PIN to the user's email.
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
    } catch (error: any) {
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
   * Legacy PIN flow: validates the PIN (OTP) and updates the password.
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
    } catch (error: any) {
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
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: error
      }
    }
  }

  async adminResendEmailConfirmation(userId: string, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      const { data: supabaseUser, error: fetchError } = await this.supabase.clientAdmin.auth.admin.getUserById(user.id);

      if (fetchError || !supabaseUser) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      if (supabaseUser.user.email_confirmed_at) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.EMAIL_ALREADY_CONFIRMED.code,
          message: API_RESPONSE.ERROR.EMAIL_ALREADY_CONFIRMED.message,
          data: null,
        };
      }

      const { error } = await this.supabase.client.auth.resend({
        type: ResendOTPTypes.SignUp,
        email: user.email,
        options: {
          emailRedirectTo: withVerificationEmailQuery(
            REDIRECT_LINKS.VERIFY_EMAIL,
            user.email
          ),
        },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminResendVerification,
          targetId: userId,
          details: error
            ? API_RESPONSE.ERROR.ADMIN_RESEND_VERIFICATION.message
            : API_RESPONSE.SUCCESS.ADMIN_RESEND_VERIFICATION.message,
          metadata: { email: user.email, adminId },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      if (error) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.ADMIN_RESEND_VERIFICATION.code,
          message: API_RESPONSE.ERROR.ADMIN_RESEND_VERIFICATION.message,
          data: error,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_RESEND_VERIFICATION.code,
        message: API_RESPONSE.SUCCESS.ADMIN_RESEND_VERIFICATION.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: error,
      };
    }
  }

  private isSupabaseEmailRateLimitError(error: {
    status?: number;
    code?: string;
    message?: string;
  } | null | undefined): boolean {
    if (!error) {
      return false;
    }

    const code = (error.code ?? '').toLowerCase();
    const message = (error.message ?? '').toLowerCase();

    return (
      error.status === 429 ||
      code.includes('rate_limit') ||
      code === 'over_email_send_rate_limit' ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('email rate') ||
      message.includes('security purposes') ||
      message.includes('only request this after') ||
      message.includes('you can only request')
    );
  }
}
