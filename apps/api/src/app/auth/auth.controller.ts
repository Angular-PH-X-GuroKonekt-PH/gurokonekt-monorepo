import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  Controller,
  Post,
  Body,
  Ip,
  Headers,
  UploadedFiles,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ForgotPasswordDto,
  MentorDocumentsInterceptor,
  RefreshTokenDto,
  RegisterMenteeDto,
  RegisterMentorDto,
  ResendConfirmationEmailDto,
  ResponseDto,
  ResponseStatus,
  SignInWithOAthDto,
  SignInWithPasswordDto,
  SWAGGER_DOCUMENTATION,
  UpdatePasswordDto,
  ResetPasswordDto,
  VerifyResetPinDto,
  VerifyPasswordChangeDto,
} from '@gurokonekt/models';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ====================================================
  // POST - Register Mentee
  // ====================================================

  @Post('register-mentee')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.REGISTER_MENTEE.summary,
    description: SWAGGER_DOCUMENTATION.REGISTER_MENTEE.description,
  })
  @ApiBody({
    type: RegisterMenteeDto,
    examples: {
      default: { summary: 'Typical mentee registration', value: SWAGGER_DOCUMENTATION.REGISTER_MENTEE.bodyExample },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mentee registered successfully. Confirmation email sent.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 201,
        message: 'Mentee registered successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error — missing or invalid fields, password mismatch, or invalid phone format.' })
  @ApiResponse({ status: 409, description: 'User with this email or phone number already exists.' })
  @ApiResponse({ status: 500, description: 'Internal server error (Supabase or database failure).' })
  async registerMentee(
    @Body() input: RegisterMenteeDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string,
  ) {
    const response = await this.authService.registerMentee(input, ipAddress, userAgent, origin);
    
    // If service returns an error status, throw the appropriate HTTP exception
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Register Mentor
  // ====================================================

  @Post('register-mentor')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.REGISTER_MENTOR.summary,
    description: SWAGGER_DOCUMENTATION.REGISTER_MENTOR.description,
  })
  @ApiBody({
    type: RegisterMentorDto,
    description: 'Mentor registration data + optional supporting documents (PDF/PNG/JPEG, max 10 MB each, up to 5 files). Send as multipart/form-data.',
  })
  @ApiResponse({
    status: 201,
    description: 'Mentor registered successfully. Account enters pending_review state. Confirmation email sent.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 201,
        message: 'Mentor registered successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error — missing fields, invalid file type, password mismatch, or invalid phone format.' })
  @ApiResponse({ status: 409, description: 'User with this email or phone number already exists.' })
  @ApiResponse({ status: 500, description: 'Internal server error (Supabase or database failure).' })
  @UseInterceptors(MentorDocumentsInterceptor)
  async registerMentor(
    @Body() input: RegisterMentorDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string,
  ) {
    const response = await this.authService.registerMentor(input, files, ipAddress, userAgent, origin);
    
    // If service returns an error status, throw the appropriate HTTP exception
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Login
  // ====================================================

  @Post('login')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.LOGIN.summary,
    description: SWAGGER_DOCUMENTATION.LOGIN.description,
  })
  @ApiBody({
    type: SignInWithPasswordDto,
    examples: {
      default: { summary: 'Email + password login', value: SWAGGER_DOCUMENTATION.LOGIN.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Signed in successfully. Returns a JWT access token.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Signed in with password successfully',
        data: { accessToken: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  @ApiResponse({ status: 403, description: 'Email address is not yet verified. Resend confirmation link first.' })
  @ApiResponse({ status: 429, description: 'Too many failed login attempts. Try again later.' })
  async signIn(
    @Body() input: SignInWithPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string
  ) {
    const response = await this.authService.signInWithPassword(input, ipAddress, userAgent, origin);
    
    // If service returns an error status, throw the appropriate HTTP exception
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Refresh Token
  // ====================================================
  //
  // FRONTEND INTEGRATION NOTE:
  //
  // The frontend currently does NOT store the refresh token. To use this
  // endpoint the Angular team needs to make the following changes:
  //
  // 1. AuthStorageService (core/storage/auth-storage.service.ts)
  //    Add setRefreshToken(token: string) / getRefreshToken() / clearRefreshToken()
  //    using a new localStorage key e.g. 'auth_refresh_token'.
  //
  // 2. AuthStateModel (core/auth/models/auth.state.model.ts)
  //    Add `refreshToken: string | null` to the interface and initialAuthState.
  //
  // 3. AuthService.login() (core/auth/services/auth.service.ts)
  //    The login response already contains `response.data.session.refresh_token`.
  //    Map it alongside the access token in the returned AuthResponse object.
  //
  // 4. AuthState.loginSuccess (core/auth/store/auth.state.ts)
  //    Call storage.setRefreshToken(refreshToken) when storing the access token.
  //    Also persist refreshToken in the NGXS state.
  //
  // 5. AuthState.logout (core/auth/store/auth.state.ts)
  //    Call storage.clearRefreshToken() inside the logout action.
  //
  // 6. auth.interceptor.ts (core/auth/interceptors/auth.interceptor.ts)
  //    When an HTTP response returns 401 with errorCode === 'SESSION_EXPIRED':
  //    a. Read the stored refresh token.
  //    b. Call POST /auth/refresh-token with { refreshToken }.
  //    c. If successful: store the new access + refresh tokens, then retry the
  //       original failed request with the new access token.
  //    d. If the refresh call also returns 401: clear storage and redirect to /login.
  //
  // 7. auth.state.ts getErrorMessage() (core/auth/store/auth.state.ts line 309)
  //    The current hardcoded `if (status === 401) return 'Invalid email or password'`
  //    will incorrectly label session-expiry errors. Update it to check the
  //    errorCode field from the response body:
  //      const errorCode = originalError?.error?.errorCode;
  //      if (status === 401 && errorCode === 'SESSION_EXPIRED')
  //        return 'Your session has expired. Please log in again.';
  //      if (status === 401) return 'Invalid email or password. Please try again.';
  //
  // ====================================================

  @Post('refresh-token')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.REFRESH_TOKEN.summary,
    description: SWAGGER_DOCUMENTATION.REFRESH_TOKEN.description,
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      default: { summary: 'Refresh session tokens', value: SWAGGER_DOCUMENTATION.REFRESH_TOKEN.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully. Returns a new access token and refresh token.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'new-supabase-refresh-token',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid or has expired. User must log in again.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async refreshToken(@Body() input: RefreshTokenDto) {
    const response = await this.authService.refreshToken(input);

    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.UNAUTHORIZED,
      );
    }

    return response;
  }

  // ====================================================
  // POST - OAuth Sign In
  // ====================================================

  @Post('signin/oauth')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.SIGNIN_OAUTH.summary,
    description: SWAGGER_DOCUMENTATION.SIGNIN_OAUTH.description,
  })
  @ApiBody({
    type: SignInWithOAthDto,
    examples: {
      google: { summary: 'Sign in with Google', value: SWAGGER_DOCUMENTATION.SIGNIN_OAUTH.bodyExample },
      github: { summary: 'Sign in with GitHub', value: { provider: 'github' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Signed in with OAuth successfully. Returns a JWT access token.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Signed in with OAuth successfully',
        data: { accessToken: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid provider.' })
  @ApiResponse({ status: 401, description: 'OAuth token validation failed.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async signInWithOAuth(@Body() input: SignInWithOAthDto) {
    const response = await this.authService.signInWithOAuth(input);
    
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Resend Confirmation Link
  // ====================================================

  @Post('resend-confirmation-link')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.RESEND_CONFIRMATION.summary,
    description: SWAGGER_DOCUMENTATION.RESEND_CONFIRMATION.description,
  })
  @ApiBody({
    type: ResendConfirmationEmailDto,
    examples: {
      default: { summary: 'Resend signup confirmation', value: SWAGGER_DOCUMENTATION.RESEND_CONFIRMATION.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmation email sent successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Confirmation email sent successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email address is already confirmed.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 429, description: 'Resend limit reached. Maximum 3 attempts per day with 60-second minimum interval.' })
  async resendSignUp(
    @Body() input: ResendConfirmationEmailDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string,
  ) {
    const response = await this.authService.resendEmailSignUpConfirmation(input, ipAddress, userAgent, origin);
    
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Verify Password Change (step 2 of 2) — MUST be before update-password
  // ====================================================

  @Post('update-password/verify')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.VERIFY_PASSWORD_CHANGE.summary,
    description: SWAGGER_DOCUMENTATION.VERIFY_PASSWORD_CHANGE.description,
  })
  @ApiBody({
    type: VerifyPasswordChangeDto,
    examples: {
      default: { summary: 'Submit PIN to confirm password change', value: SWAGGER_DOCUMENTATION.VERIFY_PASSWORD_CHANGE.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Your password has been updated!',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'PIN is invalid, expired, or newPassword does not match the pending hash.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async verifyPasswordChange(
    @Body() input: VerifyPasswordChangeDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.authService.verifyPasswordChange(input, ipAddress, userAgent);

    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST,
      );
    }

    return response;
  }

  // ====================================================
  // POST - Update Password
  // ====================================================

  @Post('update-password')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.UPDATE_PASSWORD.summary,
    description: SWAGGER_DOCUMENTATION.UPDATE_PASSWORD.description,
  })
  @ApiBody({
    type: UpdatePasswordDto,
    examples: {
      default: { summary: 'Change current password', value: SWAGGER_DOCUMENTATION.UPDATE_PASSWORD.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Your password has been updated!',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'New password does not meet requirements or does not match confirmPassword.' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 429, description: 'Too many incorrect password attempts. Try again later.' })
  async updatePassword(
    @Body() input: UpdatePasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const response = await this.authService.updatePassword(input, ipAddress, userAgent);
    
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Forgot Password
  // ====================================================

  @Post('forgot-password')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.FORGOT_PASSWORD.summary,
    description: SWAGGER_DOCUMENTATION.FORGOT_PASSWORD.description,
  })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      default: { summary: 'Request password reset email', value: SWAGGER_DOCUMENTATION.FORGOT_PASSWORD.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent to email (response is the same even if the email does not exist).',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Password reset link sent to your email',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async forgotPassword(
    @Body() input: ForgotPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string
  ) {
    const response = await this.authService.forgotPassword(input, ipAddress, userAgent, origin);
    
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Reset Password (step 2 of 3)
  // ====================================================

  @Post('reset-password')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.RESET_PASSWORD.summary,
    description: SWAGGER_DOCUMENTATION.RESET_PASSWORD.description,
  })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      default: { summary: 'Submit new password (step 2)', value: SWAGGER_DOCUMENTATION.RESET_PASSWORD.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PIN code sent to email. Proceed to POST /auth/verify-reset-pin.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'PIN code sent to your email',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Password does not meet requirements or confirmPassword does not match.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async resetPassword(
    @Body() input: ResetPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const response = await this.authService.resetPassword(input, ipAddress, userAgent);
    
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }

  // ====================================================
  // POST - Verify Reset PIN (step 3 of 3)
  // ====================================================

  @Post('verify-reset-pin')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.VERIFY_RESET_PIN.summary,
    description: SWAGGER_DOCUMENTATION.VERIFY_RESET_PIN.description,
  })
  @ApiBody({
    type: VerifyResetPinDto,
    examples: {
      default: { summary: 'Verify PIN and apply new password', value: SWAGGER_DOCUMENTATION.VERIFY_RESET_PIN.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PIN verified and password reset successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Your password has been updated!',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'PIN is invalid or has expired. Restart the flow from POST /auth/forgot-password.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async verifyResetPin(
    @Body() input: VerifyResetPinDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const response = await this.authService.verifyResetPin(input, ipAddress, userAgent);
    
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST
      );
    }
    
    return response;
  }
}
