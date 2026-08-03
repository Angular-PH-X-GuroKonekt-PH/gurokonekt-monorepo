import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateInquiryDto,
  ResponseDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
} from '@gurokonekt/models';
import { PublicInquiryService } from './public-inquiry.service';

/**
 * Unauthenticated contact form endpoint.
 *
 * No guards by design — see `PublicMentorController` for the same reasoning.
 * Abuse is handled by reCAPTCHA verification inside the service.
 */
@ApiTags('Public')
@Controller('public/inquiries')
export class PublicInquiryController {
  constructor(private readonly publicInquiryService: PublicInquiryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.CREATE_INQUIRY.summary,
    description: SWAGGER_DOCUMENTATION.CREATE_INQUIRY.description,
  })
  @ApiBody({
    type: CreateInquiryDto,
    examples: {
      default: { value: SWAGGER_DOCUMENTATION.CREATE_INQUIRY.bodyExample },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Inquiry submitted successfully.',
    type: ResponseDto,
  })
  async createInquiry(@Body() dto: CreateInquiryDto) {
    const response = await this.publicInquiryService.createInquiry(dto);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }
}
