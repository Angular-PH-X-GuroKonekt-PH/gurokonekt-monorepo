import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateReviewDto,
  GetReviewsQueryDto,
  ResponseDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ====================================================
  // POST - Submit Review (mentee only, COMPLETED bookings)
  // ====================================================

  @Post()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.CREATE_REVIEW.summary,
    description: SWAGGER_DOCUMENTATION.CREATE_REVIEW.description,
  })
  @ApiBody({
    type: CreateReviewDto,
    examples: {
      default: {
        summary: 'Review a completed session',
        value: SWAGGER_DOCUMENTATION.CREATE_REVIEW.bodyExample,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Review submitted successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 201,
        message: 'Review submitted successfully',
        data: {
          id: 'd1e2f3a4-b5c6-7890-abcd-ef1234567890',
          bookingId: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
          mentorId: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
          menteeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          rating: 5,
          comment: 'Very insightful session — clear, practical advice.',
          createdAt: '2026-07-20T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error, or the booking is not COMPLETED.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — you are not the mentee for this booking.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  @ApiResponse({ status: 409, description: 'You have already reviewed this session.' })
  async create(
    @Body() dto: CreateReviewDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    const response = await this.reviewService.create(dto, req.user.id);

    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST,
      );
    }

    return response;
  }

  // ====================================================
  // GET - Reviews By Booking Or Mentor
  // ====================================================

  @Get()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GET_REVIEWS.summary,
    description: SWAGGER_DOCUMENTATION.GET_REVIEWS.description,
  })
  @ApiQuery({
    name: 'bookingId',
    required: false,
    type: String,
    description: 'Return the review for this booking. Mutually exclusive with mentorId.',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @ApiQuery({
    name: 'mentorId',
    required: false,
    type: String,
    description: 'Return all reviews for this mentor. Mutually exclusive with bookingId.',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Reviews retrieved successfully',
        data: {
          data: [
            {
              id: 'd1e2f3a4-b5c6-7890-abcd-ef1234567890',
              bookingId: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
              mentorId: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
              menteeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              rating: 5,
              comment: 'Very insightful session — clear, practical advice.',
              createdAt: '2026-07-20T10:00:00.000Z',
              mentee: {
                id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                firstName: 'Mia',
                lastName: 'Mentee',
                avatarAttachments: [{ publicUrl: 'https://cdn.example.com/mia.png' }],
              },
            },
          ],
          total: 42,
          page: 1,
          limit: 20,
          totalPages: 3,
          averageRating: 4.6,
          ratingCount: 42,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Provide exactly one of bookingId or mentorId.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — the booking does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async findReviews(
    @Query() query: GetReviewsQueryDto,
    @Req() req: Request & { user: { id: string; role: string } },
  ) {
    const response = await this.reviewService.findReviews(query, {
      id: req.user.id,
      role: req.user.role,
    });

    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.BAD_REQUEST,
      );
    }

    return response;
  }
}
