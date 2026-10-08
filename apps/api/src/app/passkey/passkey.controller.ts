import { Body, Controller, Headers, HttpException, HttpStatus, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  ResponseDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
  VerifyPasskeyRegistrationDto,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { PasskeyService } from './passkey.service';

@ApiTags('passkeys')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('auth/passkeys')
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  // ====================================================
  // POST - Start adding a passkey
  // ====================================================

  @Post('registration/options')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.PASSKEY_REGISTRATION_OPTIONS.summary,
    description: SWAGGER_DOCUMENTATION.PASSKEY_REGISTRATION_OPTIONS.description,
  })
  @ApiResponse({ status: 200, description: 'WebAuthn registration options for the browser.', type: ResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Admin accounts cannot add passkeys.' })
  async registrationOptions(@Req() req: Request & { user: { id: string } }) {
    const response = await this.passkeyService.getRegistrationOptions(req.user.id);
    return this.unwrap(response);
  }

  // ====================================================
  // POST - Finish adding a passkey
  // ====================================================

  @Post('registration/verify')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.PASSKEY_REGISTRATION_VERIFY.summary,
    description: SWAGGER_DOCUMENTATION.PASSKEY_REGISTRATION_VERIFY.description,
  })
  @ApiBody({
    type: VerifyPasskeyRegistrationDto,
    examples: { default: { summary: 'Browser registration response', value: SWAGGER_DOCUMENTATION.PASSKEY_REGISTRATION_VERIFY.bodyExample } },
  })
  @ApiResponse({ status: 201, description: 'Passkey saved. Returns its name and type, never key material.', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Setup timed out, or the browser response could not be verified.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 409, description: 'This passkey is already added.' })
  async verifyRegistration(
    @Body() dto: VerifyPasskeyRegistrationDto,
    @Req() req: Request & { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const response = await this.passkeyService.verifyRegistration(req.user.id, dto, ipAddress, userAgent);
    return this.unwrap(response);
  }

  private unwrap(response: ResponseDto): ResponseDto {
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
