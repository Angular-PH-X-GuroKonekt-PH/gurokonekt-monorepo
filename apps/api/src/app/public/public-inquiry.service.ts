import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  CreateInquiryDto,
  ResponseDto,
  ResponseStatus,
  SelectFields,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecaptchaFailureReason,
  RecaptchaService,
} from '../recaptcha/recaptcha.service';

@Injectable()
export class PublicInquiryService {
  private readonly logger = new Logger(PublicInquiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  /**
   * Stores a contact form submission from the public site.
   *
   * The payload has already been validated by the global `ValidationPipe`, so
   * verification runs next and the write happens last — no bot with a junk
   * payload ever costs an outbound call to Google.
   */
  async createInquiry(dto: CreateInquiryDto): Promise<ResponseDto> {
    try {
      const verification = await this.recaptcha.verify(dto.recaptchaToken);

      if (verification.ok === false) {
        return this.toVerificationError(verification.reason);
      }

      // recaptchaToken is deliberately not destructured into the row — it is a
      // single-use credential with no value once verified.
      const inquiry = await this.prisma.db.inquiry.create({
        data: {
          email: dto.email.trim(),
          fullName: dto.fullName.trim(),
          topic: dto.topic.trim(),
          message: dto.message.trim(),
        },
        select: SelectFields.getInquirySelect(),
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.CREATE_INQUIRY.code,
        message: API_RESPONSE.SUCCESS.CREATE_INQUIRY.message,
        data: {
          id: inquiry.id,
          createdAt: inquiry.createdAt.toISOString(),
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.CREATE_INQUIRY.code,
        message: API_RESPONSE.ERROR.CREATE_INQUIRY.message,
        data: error,
      };
    }
  }

  /**
   * Maps a verification failure to the right response.
   *
   * A suspected bot, a Google outage, and a misconfigured server are three very
   * different problems and should not all read as "you look like a bot".
   */
  private toVerificationError(reason: RecaptchaFailureReason): ResponseDto {
    const entry =
      reason === RecaptchaFailureReason.Unavailable
        ? API_RESPONSE.ERROR.RECAPTCHA_UNAVAILABLE
        : reason === RecaptchaFailureReason.NotConfigured
          ? API_RESPONSE.ERROR.RECAPTCHA_NOT_CONFIGURED
          : API_RESPONSE.ERROR.RECAPTCHA_FAILED;

    return {
      status: ResponseStatus.Error,
      statusCode: entry.code,
      message: entry.message,
      data: null,
    };
  }
}
