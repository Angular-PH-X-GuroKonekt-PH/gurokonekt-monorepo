import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  ListInquiriesQueryDto,
  ResponseDto,
  ResponseStatus,
  SelectFields,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminInquiryService {
  private readonly logger = new Logger(AdminInquiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists contact form submissions for the admin portal.
   *
   * Mirrors `AdminMentorService.getMentors` in shape and defaults so the admin
   * tables behave the same way across features.
   */
  async getInquiries(query: ListInquiriesQueryDto): Promise<ResponseDto> {
    try {
      const {
        search,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = query;

      const where: Record<string, unknown> = {};

      if (dateFrom || dateTo) {
        where['createdAt'] = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        };
      }

      if (search?.trim()) {
        const term = search.trim();
        where['OR'] = [
          { fullName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { topic: { contains: term, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [inquiries, total] = await Promise.all([
        this.prisma.db.inquiry.findMany({
          where,
          select: SelectFields.getInquirySelect(),
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.db.inquiry.count({ where }),
      ]);

      const data = inquiries.map((inquiry) => ({
        id: inquiry.id,
        fullName: inquiry.fullName,
        email: inquiry.email,
        topic: inquiry.topic,
        message: inquiry.message,
        createdAt: inquiry.createdAt.toISOString(),
      }));

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_INQUIRIES.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_INQUIRIES.message,
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_INQUIRIES.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_INQUIRIES.message,
        data: error,
      };
    }
  }
}
