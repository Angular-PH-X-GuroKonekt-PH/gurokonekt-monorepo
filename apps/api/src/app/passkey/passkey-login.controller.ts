import { Body, Controller, Headers, HttpCode, HttpException, HttpStatus, Ip, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ResponseDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
  VerifyPasskeyAuthenticationDto,
} from '@gurokonekt/models';
import { PasskeyLoginService } from './passkey-login.service';

/** Public: signing in with a passkey happens before there is a session. */
@ApiTags('passkeys')
@Controller('auth/passkeys/authentication')
export class PasskeyLoginController {
  constructor(private readonly passkeyLoginService: PasskeyLoginService) {}

  // ====================================================
  // POST - Start signing in with a passkey
  // ====================================================

  @Post('options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.PASSKEY_AUTHENTICATION_OPTIONS.summary,
    description: SWAGGER_DOCUMENTATION.PASSKEY_AUTHENTICATION_OPTIONS.description,
  })
  @ApiResponse({ status: 200, description: 'WebAuthn authentication options for the browser.', type: ResponseDto })
  async options() {
    return this.unwrap(await this.passkeyLoginService.getAuthenticationOptions());
  }

  // ====================================================
  // POST - Finish signing in with a passkey
  // ====================================================

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.PASSKEY_AUTHENTICATION_VERIFY.summary,
    description: SWAGGER_DOCUMENTATION.PASSKEY_AUTHENTICATION_VERIFY.description,
  })
  @ApiBody({
    type: VerifyPasskeyAuthenticationDto,
    examples: { default: { summary: 'Browser authentication response', value: SWAGGER_DOCUMENTATION.PASSKEY_AUTHENTICATION_VERIFY.bodyExample } },
  })
  @ApiResponse({ status: 200, description: 'Signed in. Same shape as POST /auth/login.', type: ResponseDto })
  @ApiResponse({ status: 401, description: 'The passkey could not be verified (same answer for every cause).' })
  @ApiResponse({ status: 403, description: 'Account blocked, or mentor pending approval / rejected.' })
  async verify(
    @Body() dto: VerifyPasskeyAuthenticationDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.unwrap(await this.passkeyLoginService.verifyAuthentication(dto, ipAddress, userAgent));
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
