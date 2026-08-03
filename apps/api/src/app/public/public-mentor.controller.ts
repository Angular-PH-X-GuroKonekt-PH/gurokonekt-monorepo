import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  FEATURED_MENTORS_DEFAULT_LIMIT,
  FEATURED_MENTORS_MAX_LIMIT,
  FeaturedMentorsQueryDto,
  ResponseDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
} from '@gurokonekt/models';
import { PublicMentorService } from './public-mentor.service';

/**
 * Unauthenticated endpoints for the public marketing site.
 *
 * This controller deliberately has NO guards. Keep it that way — anything added
 * here is readable by anyone on the internet. Authenticated mentor reads belong
 * on `SearchController`, which is guarded at the class level.
 */
@ApiTags('Public')
@Controller('public/mentors')
export class PublicMentorController {
  constructor(private readonly publicMentorService: PublicMentorService) {}

  @Get('featured')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GET_FEATURED_MENTORS.summary,
    description: SWAGGER_DOCUMENTATION.GET_FEATURED_MENTORS.description,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: `Number of mentors to return. Defaults to ${FEATURED_MENTORS_DEFAULT_LIMIT}, capped at ${FEATURED_MENTORS_MAX_LIMIT}.`,
    example: FEATURED_MENTORS_DEFAULT_LIMIT,
  })
  @ApiResponse({
    status: 200,
    description: 'Featured mentors retrieved successfully.',
    type: ResponseDto,
  })
  async getFeaturedMentors(@Query() query: FeaturedMentorsQueryDto) {
    const response = await this.publicMentorService.getFeaturedMentors(query);
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
