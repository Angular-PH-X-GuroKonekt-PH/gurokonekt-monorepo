import { Body, Controller, Get, Headers, HttpCode, HttpException, HttpStatus, Ip, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto, ResponseStatus, SetPasswordDto, UpdateAuthenticationSettingsDto } from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AllowIncompleteAuthSetup } from './allow-incomplete-auth-setup.decorator';
import { AuthRequirementsService } from './auth-requirements.service';

type AuthedRequest = { user: { id: string; authenticatedAt?: Date | null } };

export function unwrap(response: ResponseDto): ResponseDto {
  if (response.status === ResponseStatus.Error) {
    throw new HttpException(
      { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
      response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  return response;
}

@ApiTags('security-setup')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@AllowIncompleteAuthSetup()
@Controller('auth/security-setup')
export class AuthRequirementsController {
  constructor(private readonly authRequirements: AuthRequirementsService) {}

  @Get()
  @ApiOperation({
    summary: 'My sign-in setup',
    description:
      'Which sign-in methods this account has and which the platform requires. While requirementsCompleted is false, ' +
      'every other protected endpoint answers 403 with errorCode AUTH_SETUP_REQUIRED.',
  })
  @ApiResponse({ status: 200, description: 'UserAuthenticationStatusInterface', type: ResponseDto })
  async status(@Req() req: AuthedRequest) {
    return unwrap(await this.authRequirements.getMyStatus(req.user.id));
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set a first password',
    description: 'For accounts created with Google, which have no password. Needs a sign-in from the last 10 minutes.',
  })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password set. Returns the updated setup status.', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Sign-in older than 10 minutes (data.reauthRequired).' })
  @ApiResponse({ status: 409, description: 'The account already has a password.' })
  async setPassword(
    @Body() dto: SetPasswordDto,
    @Req() req: AuthedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return unwrap(await this.authRequirements.setPassword(req.user, dto, ipAddress, userAgent));
  }
}

@ApiTags('admin-authentication-settings')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/authentication-settings')
export class AdminAuthenticationSettingsController {
  constructor(private readonly authRequirements: AuthRequirementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the sign-in methods every account must have' })
  @ApiResponse({ status: 200, description: 'AuthenticationSettingsInterface', type: ResponseDto })
  async get() {
    return unwrap(await this.authRequirements.getSettings());
  }

  @Put()
  @ApiOperation({
    summary: 'Save the sign-in methods every account must have',
    description: 'Email and password is always required. Applies to every account, including signed-in ones. Logged.',
  })
  @ApiBody({ type: UpdateAuthenticationSettingsDto })
  @ApiResponse({ status: 200, description: 'Saved. Returns the new settings.', type: ResponseDto })
  async update(
    @Body() dto: UpdateAuthenticationSettingsDto,
    @Req() req: AuthedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return unwrap(await this.authRequirements.updateSettings(req.user.id, dto, ipAddress, userAgent));
  }
}
