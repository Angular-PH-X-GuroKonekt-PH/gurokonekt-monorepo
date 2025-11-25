import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginDto } from '@gurokonekt/models/authentication/login.dto';
import { SignupDto } from '@gurokonekt/models/authentication/signup.dto';
import { AuthResponseDto } from '@gurokonekt/models/authentication/auth-response.dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authenticationService.login(loginDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authenticationService.signup(signupDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body('accessToken') accessToken: string) {
    return this.authenticationService.logout(accessToken);
  }
}