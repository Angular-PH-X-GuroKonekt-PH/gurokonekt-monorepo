import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  RenamePasskeyDto,
  ResponseDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
  VerifyPasskeyRegistrationDto,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { PasskeyRequester, PasskeyService } from './passkey.service';

type PasskeyRequest = Request & { user: PasskeyRequester };

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
  async registrationOptions(@Req() req: PasskeyRequest) {
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
    @Req() req: PasskeyRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const response = await this.passkeyService.verifyRegistration(req.user.id, dto, ipAddress, userAgent);
    return this.unwrap(response);
  }

  // ====================================================
  // GET - List my passkeys
  // ====================================================

  @Get()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.PASSKEYS_LIST.summary,
    description: SWAGGER_DOCUMENTATION.PASSKEYS_LIST.description,
  })
  @ApiResponse({ status: 200, description: "The caller's passkeys, newest first.", type: ResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  async list(@Req() req: PasskeyRequest) {
    return this.unwrap(await this.passkeyService.listPasskeys(req.user.id));
  }

  // ====================================================
  // PATCH - Rename a passkey
  // ====================================================

  @Patch(':passkeyId')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.PASSKEY_RENAME.summary,
    description: SWAGGER_DOCUMENTATION.PASSKEY_RENAME.description,
  })
  @ApiBody({
    type: RenamePasskeyDto,
    examples: { default: { summary: 'New name', value: SWAGGER_DOCUMENTATION.PASSKEY_RENAME.bodyExample } },
  })
  @ApiResponse({ status: 200, description: 'Passkey renamed.', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Empty or too long name, or the ID is not a UUID.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 404, description: "Passkey not found (or it isn't yours)." })
  async rename(
    @Param('passkeyId', ParseUUIDPipe) passkeyId: string,
    @Body() dto: RenamePasskeyDto,
    @Req() req: PasskeyRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.unwrap(await this.passkeyService.renamePasskey(req.user.id, passkeyId, dto, ipAddress, userAgent));
  }

  // ====================================================
  // DELETE - Remove a passkey (needs a recent sign-in)
  // ====================================================

  @Delete(':passkeyId')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.PASSKEY_REMOVE.summary,
    description: SWAGGER_DOCUMENTATION.PASSKEY_REMOVE.description,
  })
  @ApiResponse({ status: 200, description: 'Passkey removed; it no longer works for sign-in.', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'The ID is not a UUID.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Sign-in is older than 10 minutes. data.reauthRequired is true.' })
  @ApiResponse({ status: 404, description: "Passkey not found (or it isn't yours)." })
  async remove(
    @Param('passkeyId', ParseUUIDPipe) passkeyId: string,
    @Req() req: PasskeyRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.unwrap(await this.passkeyService.removePasskey(req.user, passkeyId, ipAddress, userAgent));
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
