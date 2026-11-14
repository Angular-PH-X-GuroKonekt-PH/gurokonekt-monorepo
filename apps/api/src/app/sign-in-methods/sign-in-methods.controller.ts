import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  ConnectGoogleDto,
  DisconnectGoogleDto,
  ResponseDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { SignInMethodsService } from './sign-in-methods.service';

type SignInMethodsRequest = Request & { user: { id: string; authenticatedAt?: Date | null } };

@ApiTags('sign-in-methods')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('auth/sign-in-methods')
export class SignInMethodsController {
  constructor(private readonly signInMethodsService: SignInMethodsService) {}

  @Get()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.SIGN_IN_METHODS_LIST.summary,
    description: SWAGGER_DOCUMENTATION.SIGN_IN_METHODS_LIST.description,
  })
  @ApiResponse({ status: 200, description: '{ password, google: { connected, email }, passkeys }', type: ResponseDto })
  async list(@Req() req: SignInMethodsRequest) {
    return this.unwrap(await this.signInMethodsService.listMethods(req.user.id));
  }

  @Post('google')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GOOGLE_CONNECT.summary,
    description: SWAGGER_DOCUMENTATION.GOOGLE_CONNECT.description,
  })
  @ApiBody({ type: ConnectGoogleDto })
  @ApiResponse({ status: 201, description: 'Google connected. Returns the updated methods and fresh tokens.', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Sign-in older than 10 minutes (data.reauthRequired).' })
  @ApiResponse({ status: 409, description: 'This Google account is connected to another GuroKonekt account.' })
  @ApiResponse({ status: 503, description: 'Manual linking is disabled in Supabase.' })
  async connectGoogle(
    @Body() dto: ConnectGoogleDto,
    @Req() req: SignInMethodsRequest,
    @Headers('authorization') authorization: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.unwrap(
      await this.signInMethodsService.connectGoogle(this.requester(req, authorization), dto, ipAddress, userAgent)
    );
  }

  @Delete('google')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GOOGLE_DISCONNECT.summary,
    description: SWAGGER_DOCUMENTATION.GOOGLE_DISCONNECT.description,
  })
  @ApiBody({ type: DisconnectGoogleDto })
  @ApiResponse({ status: 200, description: 'Google disconnected. Returns the updated methods and fresh tokens.', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Google is the only way to sign in to this account.' })
  @ApiResponse({ status: 403, description: 'Sign-in older than 10 minutes (data.reauthRequired).' })
  @ApiResponse({ status: 404, description: "Google isn't connected." })
  async disconnectGoogle(
    @Body() dto: DisconnectGoogleDto,
    @Req() req: SignInMethodsRequest,
    @Headers('authorization') authorization: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.unwrap(
      await this.signInMethodsService.disconnectGoogle(this.requester(req, authorization), dto, ipAddress, userAgent)
    );
  }

  private requester(req: SignInMethodsRequest, authorization: string) {
    return {
      id: req.user.id,
      authenticatedAt: req.user.authenticatedAt,
      accessToken: (authorization ?? '').replace(/^Bearer\s+/i, ''),
    };
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
