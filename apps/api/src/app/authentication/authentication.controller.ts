import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { LoginDto } from '@gurokonekt/models/authentication/login.dto';
import { SignupDto } from '@gurokonekt/models/authentication/signup.dto';
import { AuthResponseDto } from '@gurokonekt/models/authentication/auth-response.dto';

@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User logged in successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authenticationService.login(loginDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  @ApiOperation({ summary: 'Signup a new user' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: 'User signed up successfully', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authenticationService.signup(signupDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Logout a user' })
  @ApiBody({ schema: { type: 'object', properties: { accessToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Body('accessToken') accessToken: string) {
    return this.authenticationService.logout(accessToken);
  }
}