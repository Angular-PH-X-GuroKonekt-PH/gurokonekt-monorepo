import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  Controller,
  Post,
  Body,
  Ip,
  Headers,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MentorDocumentsInterceptor, RegisterMenteeDto, RegisterMentorDto, ResendConfirmationEmailDto, ResponseDto, SignInWithOAthDto, SignInWithPasswordDto, UpdatePasswordDto, ForgotPasswordDto, ResetPasswordDto, VerifyResetPinDto } from '@gurokonekt/models';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-mentee')
  @ApiOperation({ summary: 'Register a new mentee' })
  @ApiResponse({ status: 200, description: 'Mentee created successfully', type: ResponseDto })
  async registerMentee(
    @Body() input: RegisterMenteeDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.authService.registerMentee(input, ipAddress, userAgent);
  }

  @Post('register-mentor')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a new mentor' })
  @ApiResponse({ status: 200, description: 'Mentor created successfully', type: ResponseDto })
  @UseInterceptors(MentorDocumentsInterceptor)
  async registerMentor(
    @Body() input: RegisterMentorDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.registerMentor(input, files, ipAddress, userAgent);
  }

  @Post('login')
  @ApiOperation({ summary: 'Sign in with email/password' })
  @ApiResponse({ status: 200, description: 'User signed in successfully', type: ResponseDto })
  async signIn(
    @Body() input: SignInWithPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string
  ) {
    return this.authService.signInWithPassword(input, ipAddress, userAgent, origin);
  }

  @Post('signin/oauth')
  @ApiOperation({ summary: 'Sign in with OAuth provider' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async signInWithOAuth(@Body() input: SignInWithOAthDto) {
    return this.authService.signInWithOAuth(input);
  }

  @Post('resend-confirmation-link')
  @ApiOperation({ summary: 'Resend sign-up confirmation email' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async resendSignUp(
    @Body() input: ResendConfirmationEmailDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.authService.resendEmailSignUpConfirmation(input, ipAddress, userAgent);
  }

  @Post('update-password')
  @ApiOperation({ summary: 'Update password for authenticated Mentee/Mentor' })
  @ApiResponse({ status: 200, description: 'Password updated successfully', type: ResponseDto })
  async updatePassword(
    @Body() input: UpdatePasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.authService.updatePassword(input, ipAddress, userAgent);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset link via email' })
  @ApiResponse({ status: 200, description: 'Reset link sent to email', type: ResponseDto })
  async forgotPassword(
    @Body() input: ForgotPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string
  ) {
    return this.authService.forgotPassword(input, ipAddress, userAgent, origin);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Submit new password after clicking reset link; sends PIN to email' })
  @ApiResponse({ status: 200, description: 'PIN sent to email', type: ResponseDto })
  async resetPassword(
    @Body() input: ResetPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.authService.resetPassword(input, ipAddress, userAgent);
  }

  @Post('verify-reset-pin')
  @ApiOperation({ summary: 'Verify PIN and finalize password reset' })
  @ApiResponse({ status: 200, description: 'Password updated successfully', type: ResponseDto })
  async verifyResetPin(
    @Body() input: VerifyResetPinDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.authService.verifyResetPin(input, ipAddress, userAgent);
  }
}
