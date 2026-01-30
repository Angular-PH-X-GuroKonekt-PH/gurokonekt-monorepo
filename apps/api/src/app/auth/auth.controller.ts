import { Controller, Post, Get, Body, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  ResendSignUpDto,
  ResendChangeEmailDto,
  SignInWithOAuthDto
} from '../dto/auth'
import { AsyncReturnDto } from '../dto/models.dto';
import { RegisterMenteeDto } from '../dto/auth/register-mentee.dto';
import { RegisterMentorDto } from '../dto/auth/register-mentor.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 200, description: 'User signed up successfully', type: AsyncReturnDto })
  async signUp(@Body() input: SignUpDto) {
    return this.authService.signUpWithEmailPassword(input);
  }

  @Post('register-mentee')
  @ApiOperation({ summary: 'Register a new mentee' })
  @ApiResponse({ status: 200, description: 'Mentee created successfully', type: AsyncReturnDto })
  async registerMentee(
    @Body() input: RegisterMenteeDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.authService.registerMentee(input, ipAddress, userAgent);
  }

  @Post('register-mentor')
  @ApiOperation({ summary: 'Register a new mentor' })
  @ApiResponse({ status: 200, description: 'Mentor created successfully', type: AsyncReturnDto })
  async registerMentor(@Body() input: RegisterMentorDto) {
    return this.authService.registerMentor(input);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email/password' })
  @ApiResponse({ status: 200, description: 'User signed in successfully', type: AsyncReturnDto })
  async signIn(@Body() input: SignInDto) {
    return this.authService.signInWithPassword(input);
  }

  @Post('signin/oauth')
  @ApiOperation({ summary: 'Sign in with OAuth provider' })
  @ApiResponse({ status: 200, type: AsyncReturnDto })
  async signInWithOAuth(@Body() input: SignInWithOAuthDto) {
    return this.authService.signInWithOAuth(input);
  }

  @Post('resend-signup')
  @ApiOperation({ summary: 'Resend sign-up confirmation email' })
  @ApiResponse({ status: 200, type: AsyncReturnDto })
  async resendSignUp(@Body() input: ResendSignUpDto) {
    return this.authService.resendEmailSignUpConfirmation(input);
  }

  @Post('resend-change-email')
  @ApiOperation({ summary: 'Resend email change confirmation' })
  @ApiResponse({ status: 200, type: AsyncReturnDto })
  async resendChangeEmail(@Body() input: ResendChangeEmailDto) {
    return this.authService.resendEmailChangeEmail(input);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get currently authenticated user' })
  @ApiResponse({ status: 200, type: AsyncReturnDto })
  async me() {
    return this.authService.getUserAuth();
  }
}
